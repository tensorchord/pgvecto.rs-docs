# Performance Tuning

## Index Build Time

Index building can be parallelized, and with external centroid precomputation. Optimize parallelism using the following settings:

```SQL
-- Set this to the number of CPU cores available for parallel operations.
SET max_parallel_maintenance_workers = 8;
SET max_parallel_workers = 8;

-- Adjust the total number of worker processes. 
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET max_worker_processes = 16;
```

The number of parallel workers also depends on the table's configuration. By default, this is automatically determined by PostgreSQL. If PostgreSQL identifies it as disabled, parallel index builds will not take effect. You can override PostgreSQL's behavior by adjusting the table's `parallel_workers` setting to enable parallel builds.

```sql
ALTER TABLE t set (parallel_workers = 8);
```

When building an index on a table with more than 10 million vectors, you can choose to consume more memory to accelerate the process by setting `build.pin` to `true`:

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
residual_quantization = false
build.pin = true
$$);
```

## Query Performance
You can fine-tune the search performance by adjusting the `probes` and `epsilon` parameters:

```sql
-- Set probes to control the number of lists scanned. 
-- Recommended range: 3%–10% of the total `lists` value.
SET vchordrq.probes = 100;

-- Set epsilon to control the reranking precision.
-- Larger value means more rerank for higher recall rate and latency.
-- If you need a less precise query, setting it to 1.0 may be appropriate.
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

## Index Internal Build

There are 4 options for index internal build, except `lists`.

* `spherical_centroids`: Specifies whether to use spherical K-means algorithm. If the model generates cosine similarity embeddings, set this to `true`; otherwise, set to `false`. Possible values: `true`, `false`. Default: `false`.

* `sampling_factor`: Specifies the number of vectors sampled by K-means algorithm. The higher this value, the slower the build, the greater the memory consumption, and the better search performance. Possible values: any integer between `1` and `1024`. Default: `256`.

* `kmeans_iterations`: Specifies the number of iterations for K-means algorithm. The higher this value, the slower the build. Possible values: any integer between `0` and `1024`. Default: `10`.

* `build_threads`: Specifies the number of threads used by K-means algorithm. The higher this value, the faster the build. Possible values: any integer between `1` and `255`. Default: `1`.

An example of these options:

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
residual_quantization = false
[build.internal]
lists = [1000]
spherical_centroids = true
sampling_factor = 512
kmeans_iterations = 25
build_threads = 16
$$);
```
