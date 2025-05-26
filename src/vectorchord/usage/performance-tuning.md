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

When building an index on a table with more than 10 million vectors, you can choose to consume more shared memory to accelerate the process by setting `build.pin` to `true`:

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
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
