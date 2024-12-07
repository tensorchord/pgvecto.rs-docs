# Overview

VectorChord (vchord) is a PostgreSQL extension designed for scalable, high-performance, and disk-efficient vector similarity search, and serves as the successor to [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs).

With VectorChord, you can store 400,000 vectors for just $1, enabling significant savings: 6x more vectors compared to Pinecone's optimized storage and 26x more than pgvector / pgvecto.rs for the same price[^1]. For further insights, check out our [launch blog post](https://blog.pgvecto.rs/vectorchord-store-400k-vectors-for-1-in-postgresql).

[^1]: Based on [MyScale Benchmark](https://myscale.github.io/benchmark/#/) with 768-dimensional vectors and 95% recall.

## Features

VectorChord introduces remarkable enhancements over pgvecto.rs and pgvector:

**⚡ Enhanced Performance**: Delivering optimized operations with up to 5x faster queries, 16x higher insert throughput, and 16x quicker[^3] index building compared to pgvector's HNSW implementation.

[^3]: Based on [MyScale Benchmark](https://myscale.github.io/benchmark/#/) with 768-dimensional vectors. Please checkout our [blog post](https://blog.pgvecto.rs/vectorchord-store-400k-vectors-for-1-in-postgresql) for more details.

**💰 Affordable Vector Search**: Query 100M 768-dimensional vectors using just 32GB of memory, achieving 35ms P50 latency with top10 recall@95%, helping you keep infrastructure costs down while maintaining high search quality.

**🔌 Seamless Integration**: Fully compatible with pgvector data types and syntax while providing optimal defaults out of the box - no manual parameter tuning needed. Just drop in VectorChord for enhanced performance.

**🔧 External Index Build**: Leverage IVF to build indexes externally (e.g., on GPU) for faster KMeans clustering, combined with RaBitQ[^2] compression to efficiently store vectors while maintaining search quality through autonomous reranking.

[^2]: Gao, Jianyang, and Cheng Long. "RaBitQ: Quantizing High-Dimensional Vectors with a Theoretical Error Bound for Approximate Nearest Neighbor Search." Proceedings of the ACM on Management of Data 2.3 (2024): 1-27.

## Quick Start

For new users, we recommend using the Docker image to get started quickly.
```bash
docker run \
  --name vectorchord-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/vchord-postgres:pg17-v0.1.0
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```bash
psql -h localhost -p 5432 -U postgres
```
Run the following SQL to ensure the extension is enabled.

```SQL
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

And make sure to add `vchord.so` to the `shared_preload_libraries` in `postgresql.conf`.

```SQL
-- Add vchord and pgvector to shared_preload_libraries --
ALTER SYSTEM SET shared_preload_libraries = 'vchord.so';
```

To create the VectorChord RaBitQ(vchordrq) index, you can use the following SQL.

```SQL
CREATE INDEX ON gist_train USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [4096]
spherical_centroids = false
$$);
```

## Documentation

### Query

The query statement is exactly the same as pgvector. VectorChord supports any filter operation and WHERE/JOIN clauses like pgvecto.rs with VBASE.
```SQL
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```
Supported distance functions are:
- <-> - L2 distance
- <#> - (negative) inner product
- <=> - cosine distance

<!-- ### Range Query

> [!NOTE]  
> Due to the limitation of postgresql query planner, we cannot support the range query like `SELECT embedding <-> '[3,1,2]' as distance WHERE distance < 0.1 ORDER BY distance` directly.

To query vectors within a certain distance range, you can use the following syntax.
```SQL
-- Query vectors within a certain distance range
-- sphere(center, radius) means the vectors within the sphere with the center and radius, aka range query
-- <<->> is L2 distance, <<#>> is inner product, <<=>> is cosine distance
SELECT vec FROM t WHERE vec <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012) 
``` -->

### Query Performance Tuning
You can fine-tune the search performance by adjusting the `probes` and `epsilon` parameters:

```sql
-- Set probes to control the number of lists scanned. 
-- Recommended range: 3%–10% of the total `lists` value.
SET vchordrq.probes = 100;

-- Set epsilon to control the reranking precision.
-- Larger value means more rerank for higher recall rate.
-- Don't change it unless you only have limited memory.
-- Recommended range: 1.0–1.9. Default value is 1.9.
SET vchordrq.epsilon = 1.9;

-- vchordrq relies on a projection matrix to optimize performance.
-- Add your vector dimensions to the `prewarm_dim` list to reduce latency.
-- If this is not configured, the first query will have higher latency as the matrix is generated on demand.
-- Default value: '64,128,256,384,512,768,1024,1536'
-- Note: This setting requires a database restart to take effect.
ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128,256,384,512,768,1024,1536';
```

And for postgres's setting
```SQL
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

### Indexing prewarm
To prewarm the index, you can use the following SQL. It will significantly improve performance when using limited memory.
```SQL
-- vchordrq_prewarm(index_name::regclass) to prewarm the index into the shared buffer
SELECT vchordrq_prewarm('gist_train_embedding_idx'::regclass)"
```


### Index Build Time
Index building can parallelized, and with external centroid precomputation, the total time is primarily limited by disk speed. Optimize parallelism using the following settings:

```SQL
-- Set this to the number of CPU cores available for parallel operations.
SET max_parallel_maintenance_workers = 8;
SET max_parallel_workers = 8;

-- Adjust the total number of worker processes. 
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET max_worker_processes = 8;
```

### Indexing Progress
You can check the indexing progress by querying the `pg_stat_progress_create_index` view.
```SQL
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;
```

### External Index Precomputation

Unlike pure SQL, an external index precomputation will first do clustering outside and insert centroids to a PostgreSQL table. Although it might be more complicated, external build is definitely much faster on larger dataset (>5M).

To get started, you need to do a clustering of vectors using `faiss`, `scikit-learn` or any other clustering library.

The centroids should be preset in a table of any name with 3 columns:
- id(integer): id of each centroid, should be unique
- parent(integer, nullable): parent id of each centroid, should be NULL for normal clustering
- vector(vector): representation of each centroid, `pgvector` vector type

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
CREATE INDEX ON gist_train USING vchordrq (embedding vector_l2_ops) WITH (options = $$
[build.external]
table = 'public.centroids'
$$);
```

To simplify the workflow, we provide end-to-end scripts for external index pre-computation, see [scripts](https://github.com/tensorchord/VectorChord/tree/main/scripts#run-external-index-precomputation-toolkit).

### Installing From Source
Install pgrx according to [pgrx's instruction](https://github.com/pgcentralfoundation/pgrx?tab=readme-ov-file#getting-started).
```bash
cargo install --locked cargo-pgrx
cargo pgrx init --pg17 $(which pg_config) # To init with system postgres, with pg_config in PATH
cargo pgrx install --release --sudo # To install the extension into the system postgres with sudo
```

## Limitations
- Data Type Support: Currently, only the `f32` data type is supported for vectors.
- Architecture Compatibility: The fast-scan kernel is optimized for x86_64 architectures. While it runs on aarch64, performance may be lower.
- KMeans Clustering: The built-in KMeans clustering is not yet fully optimized and may require substantial memory. We strongly recommend using external centroid precomputation for efficient index construction.


## License

This project is licensed under the [GNU Affero General Public License v3.0](https://github.com/tensorchord/VectorChord/blob/main/LICENSE) and as commercial software. For commercial licensing, please contact us at support@tensorchord.ai.
