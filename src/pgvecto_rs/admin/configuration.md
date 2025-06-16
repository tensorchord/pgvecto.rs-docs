# Configuration

## Logging

By default, you cannot capture all `pgvecto.rs` logs. `pgvecto.rs` starts a background worker process for indexing, and it prints logs to standard error. To capture them, you need to set `logging_collector` to `on`. You can get more information from [PostgreSQL document about logging collector](https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOGGING-COLLECTOR).

You can set `logging_collector` to `on` with the following command:

```sh
psql -U postgres -c 'ALTER SYSTEM SET logging_collector = on;'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
docker restart pgvecto-rs-demo  # for pgvecto.rs running in docker
```

## Index configuration <Badge type="tip" text="since v0.3.0" />

For each index, there are a number of configuration items that are variable. Unlike options, they support real-time modification after the index has been created. These items can be configured by function `alter_vector_index`.

```sql
-- alter_vector_index(dim: OID, key: TEXT, value: TEXT)
SELECT alter_vector_index('index_name'::regclass::oid, 'configuration_name', 'value');
```

Here are all the available configurations.

### Threads for backend optimizing

By default, each vector index is optimized by only one thread at the backend. However, if you have multiple idle CPUs and want to take advantage of them, you can increase the number of threads.

Set the `key` argument to `optimizing.threads` and the `value` argument to the desired number of threads.

```sql
-- alter_vector_index(dim: OID, key = 'optimizing.threads', value: TEXT as INT[1-65535])
SELECT alter_vector_index('table_col_idx'::regclass::oid, 'optimizing.threads', '4');
```