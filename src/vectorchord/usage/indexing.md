# Indexing

To construct an index for vectors, first create a table named `items` with a column named `embedding` of type `vector(n)`. Then, populate the table with generated data.

```sql
CREATE TABLE items (embedding vector(3));
INSERT INTO items (embedding) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
```

You can create a vector index for squared Euclidean distance with the following SQL.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [4096]
spherical_centroids = false
$$);
```

The `[build.internal]` section contains the following options:

- `lists`: The number of lists in the inverted file.
- `spherical_centroids`: Whether to use spherical centroids.

The index will be built internally using the IVF algorithm.

## Prewarming

VectorChord is designed to be efficient for disk-based storage. However, the first query after the server starts may be slow due to the cold cache. To avoid this, you can prewarm the index. It will significantly improve performance when using limited memory.

```sql
-- vchordrq relies on a projection matrix to optimize performance.
-- Add your vector dimensions to the `prewarm_dim` list to reduce latency.
-- If this is not configured, the first query will have higher latency as the matrix is generated on demand.
-- Default value: '64,128,256,384,512,768,1024,1536'
-- Note: This setting requires a database restart to take effect.
ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128,256,384,512,768,1024,1536';

-- vchordrq_prewarm(index_name::regclass) to prewarm the index into the shared buffer
SELECT vchordrq_prewarm('items_embedding_idx'::regclass)"
```

## Parallel indexing

Index building can parallelized, the total time is **primarily limited by disk speed**. Optimize parallelism using the following settings:

```sql
-- Set this to the number of CPU cores available for parallel operations.
SET max_parallel_maintenance_workers = 8;
SET max_parallel_workers = 8;

-- Adjust the total number of worker processes. 
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET max_worker_processes = 8;
```

## External index pre-computation

Unlike pure SQL, external index precomputation performs clustering externally before inserting centroids into a PostgreSQL table. While this process may be more complex, it significantly speeds up indexing for larger datasets (>5M). We showed some benchmarks in the [blog post](https://blog.pgvecto.rs/vectorchord-store-400k-vectors-for-1-in-postgresql). It takes around 3 minutes to build an index for 1M vectors, 16x faster than standard indexing in pgvector.

You need to cluster the vectors using `faiss`, `scikit-learn`, or any other clustering library to get started.

The centroids should be preset in a table of any name with 3 columns:
- `id(integer)`: id of each centroid, should be unique
- `parent(integer, nullable)`: parent id of each centroid, should be NULL for normal clustering
- `vector(vector)`: representation of each centroid, `pgvector` vector type

And example could be like this:

```sql
-- Create table of centroids
CREATE TABLE public.centroids (id integer NOT NULL UNIQUE, parent integer, vector vector(768));
-- Insert centroids into it
INSERT INTO public.centroids (id, parent, vector) VALUES (1, NULL, '{0.1, 0.2, 0.3, ..., 0.768}');
INSERT INTO public.centroids (id, parent, vector) VALUES (2, NULL, '{0.4, 0.5, 0.6, ..., 0.768}');
INSERT INTO public.centroids (id, parent, vector) VALUES (3, NULL, '{0.7, 0.8, 0.9, ..., 0.768}');
-- ...

-- Create index using the centroid table
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
[build.external]
table = 'public.centroids'
$$);
```

To streamline the workflow, we offer end-to-end scripts for external index precomputation. Start by installing the necessary dependencies.

```shell
# PYTHON = 3.11
# When using CPU to train k-means clustering
conda install conda-forge::pgvector-python numpy pytorch::faiss-cpu conda-forge::psycopg h5py tqdm
# or
pip install pgvector-python numpy faiss-cpu psycopg h5py tqdm

# When using GPU to train k-means clustering
conda install conda-forge::pgvector-python numpy pytorch::faiss-gpu conda-forge::psycopg h5py tqdm
```

1. **Prepare your dataset in `hdf5` format**

    - If your vectors are already stored in `PostgreSQL` using `pgvector`, you can export them to a local file with:
        ```shell
        python script/dump.py -n [table name] -c [column name] -d [dim] -o export.hdf5
        ```

    - If you don't have any data yet but want to try, you can download one of these datasets:
        ```shell
        wget http://ann-benchmarks.com/sift-128-euclidean.hdf5 # num=1M dim=128 metric=l2
        wget http://ann-benchmarks.com/gist-960-euclidean.hdf5 # num=1M dim=960 metric=l2
        wget https://myscale-datasets.s3.ap-southeast-1.amazonaws.com/laion-5m-test-ip.hdf5 # num=5M dim=768 metric=dot
        wget https://myscale-datasets.s3.ap-southeast-1.amazonaws.com/laion-20m-test-ip.hdf5 # num=20M dim=768 metric=dot
        wget https://myscale-datasets.s3.ap-southeast-1.amazonaws.com/laion-100m-test-ip.hdf5 # num=100M dim=768 metric=dot
        ```
2. **Perform clustering of centroids from vectors**

    ```shell
    # For small dataset size from 1M to 5M
    python script/train.py -i [dataset file(export.hdf5)] -o [centroid filename(centroid.npy)] -lists [lists] -m [metric(l2/cos/dot)]
    # For large datasets size, 5M to 100M in size, use GPU and mmap chunks
    python script/train.py -i [dataset file(export.hdf5)] -o [centroid filename(centroid.npy)] --lists [lists] -m [metric(l2/cos/dot)] -g --mmap
    ```

    `lists` is the number of centroids for clustering, and a typical value could range from:

    $$
    4*\sqrt{len(vectors)} \le lists \le 16*\sqrt{len(vectors)}
    $$
3. **Insert vectors and centroids into the database, then create an index**

    ```shell
    python script/index.py -n [table name] -i [dataset file(export.hdf5)] -c [centroid filename(centroid.npy)] -m [metric(l2/cos/dot)] -d [dim]
    ```
4. **Check the benchmark results of VectorChord**

    ```shell
    python script/bench.py -n [table name] -i [dataset file(export.hdf5)] -m [metric(l2/cos/dot)] -p [database password] --nprob 100 --epsilon 1.0
    ```

    Larger values for `nprobe` and `epsilon` will yield more precise queries but may reduce speed.

## Progress monitoring

You can monitor the progress of the index build process using the following SQL.

```sql
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;
```

## Performance tuning

To optimize performance, you can adjust the following settings in PostgreSQL.

```sql
-- If using SSDs, set `effective_io_concurrency` to 200 for faster disk I/O.
SET effective_io_concurrency = 200;

-- Disable JIT (Just-In-Time Compilation) as it offers minimal benefit (1–2%) 
-- and adds overhead for single-query workloads.
SET jit = off;

-- Allocate at least 25% of total memory to `shared_buffers`. 
-- For disk-heavy workloads, you can increase this to up to 90% of total memory. You may also want to disable swap with network storage to avoid io hang.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET shared_buffers = '8GB';
```
