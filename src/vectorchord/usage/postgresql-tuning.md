# PostgreSQL Tuning

Indexing may be parallelized. Parallelism increases server load and is therefore not enabled by default in PostgreSQL. To enable it, refer to the following SQL.

```sql
-- Sets the maximum number of background processes that the cluster can support.
-- It's recommended to set it to at least the sum of your desired parallelism plus 8.
-- For example, if you want to use 16 threads for parallel processing, set the value at least to 24.
-- Depending on your workload, this value might be useful to be higher.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET max_worker_processes = 24;

-- Sets the maximum number of workers that the cluster can support for parallel operations.
-- It's recommended to set it to the sum of your desired parallelism minus 1.
-- For example, if you want to use 16 threads for parallel processing, set the value to 15.
SET max_parallel_workers = 15;

-- Sets the maximum number of parallel workers that can be started by a single utility command.
-- It's recommended to set it to the sum of your desired parallelism minus 1.
-- For example, if you want to use 16 threads for parallel processing, set the value to 15.
SET max_parallel_maintenance_workers = 15;
```

The number of parallel workers also depends on the table's configuration. By default, this is automatically determined by PostgreSQL. If PostgreSQL identifies it as disabled, parallel indexing will not take effect. You can override PostgreSQL's behavior by adjusting the table's `parallel_workers` setting to enable parallel indexing.

```sql
ALTER TABLE items set (parallel_workers = 15);
```

You need to tune a few settings to improve I/O performance.

```sql
-- Sets the number of concurrent disk I/O operations that PostgreSQL expects can be executed simultaneously.
-- It's recommended to set it to 20 when using SSDs for storage.
SET effective_io_concurrency = 20;
SET maintenance_io_concurrency = 20;
```

We have observed that in certain cases, malfunctioning JIT can negatively impact performance. If you do not rely on it, you may choose to disable it.

```sql
SET jit = off;
```

Finally, you need to set the size of PostgreSQL's shared buffers.

```sql
-- Sets the amount of memory the database server uses for shared memory buffers.
-- Depending on your workload, this value is recommended to be 25%~40% of the total memory.
-- For vector database workloads, this value might be useful to be 80% of the total memory.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET shared_buffers = '16GB';
```

## Asynchronous I/O {#asynchronous-i-o}

PostgreSQL 17 introduced the streaming I/O API for the first time. Building on this, PostgreSQL 18 introduces asynchronous I/O. With asynchronous I/O, PostgreSQL can initiate multiple read operations and continue processing while waiting for the results. This can improve the performance of queries that need to read large amounts of data from disk. PostgreSQL offers multiple asynchronous I/O methods. You can adjust them as needed.

This section applies only to PostgreSQL 18.

### `io_uring`

`io_uring` method uses Linux's `io_uring`, which can reduce the overhead of context switches. This interface is available in kernel 5.1 and later. You can enable this method through the GUC `io_method`.

```sql
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET io_method = 'io_uring';
```

Since `io_uring` uses additional file descriptors and locked memory, PostgreSQL may reach `RLIMIT_NOFILE` and `RLIMIT_MEMLOCK` limits. You may need to increase these limits on your system. See also

* [limits.conf (PAM)](https://www.man7.org/linux/man-pages/man5/limits.conf.5.html)
* [Process Properties (systemd)](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Process%20Properties)
* [Set ulimits in container (Docker)](https://docs.docker.com/reference/cli/docker/container/run/#ulimit)

For security reasons, container runtimes, cloud providers, and system administrators may disable `io_uring`. If this happens, check with your vendor for details. See also

* [Consider removing io_uring syscalls in from RuntimeDefault (containerd)](https://github.com/containerd/containerd/issues/9048)

`io_uring` is often considered recommended. However, performance depends on your workload. See also

* [Tuning AIO in PostgreSQL 18 (Tomas Vondra)](https://vondra.me/posts/tuning-aio-in-postgresql-18/)
* [Benchmarking Postgres 17 vs 18 (planetscale)](https://planetscale.com/blog/benchmarking-postgres-17-vs-18)

This section applies only to Linux.

### `worker`

This is the default in PostgreSQL 18. PostgreSQL avoids blocking backend by sending I/O requests to a process pool. You can explicitly enable this method through the GUC `io_method`.

```sql
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET io_method = 'worker';

-- Selects the number of I/O worker processes to use.
-- It's recommended to set it to the minimum of your parallelism and maximum value.
-- For example, if your parallelism is 16, set the value to 16.
-- The maximum value is 32, so you can't set it to anything higher.
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET io_workers = 16;
```

### `sync`

`sync` method works the same way as in PostgreSQL 17. Reads are synchronous and blocking, and `posix_fadvise` is used to provide the operating system with hints about upcoming reads. You would only use this method for debugging. You can enable this method through the GUC `io_method`.

```sql
-- Note: A restart is required for this setting to take effect.
ALTER SYSTEM SET io_method = 'sync';
```
