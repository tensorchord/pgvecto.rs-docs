# Performance Tuning

## Indexing

Indexing can be parallelized. Parallelism can increase server load and is therefore not enabled by default in PostgreSQL. To enable it, please refer to the following SQL.

```sql
-- Sets the maximum number of background processes that the cluster can support. 
-- It's recommended to set it to the sum of the parallelism you need plus 8.
-- For example, if you want to use 16 threads for parallel processing, please set the value to 24.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET max_worker_processes = 24;

-- Sets the maximum number of workers that the cluster can support for parallel operations.
-- It's recommended to set it to the sum of the parallelism you need minus 1.
-- For example, if you want to use 16 threads for parallel processing, please set the value to 15.
SET max_parallel_workers = 15;

-- Sets the maximum number of parallel workers that can be started by a single utility command.
-- It's recommended to set it to the sum of the parallelism you need minus 1.
-- For example, if you want to use 16 threads for parallel processing, please set the value to 15.
SET max_parallel_maintenance_workers = 15;
```

The number of parallel workers also depends on the table's configuration. By default, this is automatically determined by PostgreSQL. If PostgreSQL identifies it as disabled, parallel indexing will not take effect. You can override PostgreSQL's behavior by adjusting the table's `parallel_workers` setting to enable parallel indexing.

```sql
ALTER TABLE items set (parallel_workers = 15);
```

When building an index on a table with more than 10 million vectors, you can choose to consume more shared memory to accelerate the process by setting `build.pin` to `true`.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
build.pin = true
$$);
```

If you are using `build.internal`, please refer to [`build.internal.build_threads`](./indexing#build-internal-build-threads) for K-Means parallel.

## Search

To ensure the search works well, you may need to adjust some PostgreSQL parameters.

```sql
-- Sets the amount of memory the database server uses for shared memory buffers.
-- For typical database workloads, this value is recommended to be 40% of the total memory.
-- For vector database workloads, this value is recommended to be 80% of the total memory.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET shared_buffers = '16GB';

-- Sets the number of concurrent disk I/O operations that PostgreSQL expects can be executed simultaneously.
-- It's recommended to set it to 200 if you're using SSDs for databases.
SET effective_io_concurrency = 200;

-- We have observed that in certain cases, malfunctioning JIT can negatively impact performance.
-- If you do not rely on it, you may choose to disable it.
SET jit = off;
```

You can fine-tune the search performance by adjusting the `probes` and `epsilon` parameters:

```sql
-- Set probes to control the number of lists scanned. 
-- It's recommended to set it to 3%–10% of the total `lists` value.
SET vchordrq.probes = 100;

-- Set epsilon to control the reranking precision.
-- Larger value means more rerank for higher recall rate and latency.
-- It's recommended to set it to 1.0–1.9. Default value is 1.9.
SET vchordrq.epsilon = 1.9;
```

## Reference

### Indexing Options

#### `build.pin` <badge type="tip" text="since v0.2.1" />

- Description: This index parameter determines whether shared memory is used for indexing. For large datasets, you can choose to enable this option to speed up the build process.
- Type: boolean
- Default: `false`
- Example:
    - `build.pin = false` means that shared memory is not used.
    - `build.pin = true` means that shared memory is used.


