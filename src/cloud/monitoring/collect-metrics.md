# Collect Metrics

PGVecto.rs Cloud shows some database metrics on [cloud.pgvecto.rs](https://cloud.pgvecto.rs). If you want to collect metrics from your database into your self-hosted metrics system, you can follow this guide. Metrics detail can be found in the [Appendix](#appendix) section.

## Where to find your metrics

You can find your metrics on your database’s domain name with the metrics endpoint. You must provide a PGVecto.rs Cloud API Key in order to access these metrics. You can generate a API Key from the [API Keys](../manage/apikey.md) section.

You can find the metrics endpoint in cluster details.

![](../images/metrics-endpoint.png)

```shell
# Your Tembo Cloud token
APIKey="****"

curl -H "X-API-Key: ${APIKey}" \
     https://cloud.pgvecto.rs/api/v1/users/5c3cb62b-d00b-4dda-85e6-2c0452d50138/cnpgs/7680cc58-8e5f-4be2-a8cc-99d31d197dd8/metrics
```

## Configuring Prometheus

Prometheus is a metrics server which collects metrics on a schedule. To configure Prometheus to collect metrics from a PGVecto.rs Cloud instance, you must configure the target with the authentication token.

Here is a sample Prometheus configuration file:

```yaml
global:
  scrape_interval: 30s

scrape_configs:
  - job_name: 'example_target'
    scheme: https
    static_configs:
      # Use the domain name from your Postgres connection string
      - targets: ['cloud.pgvecto.rs']
    metrics_path: '/api/v1/users/5c3cb62b-d00b-4dda-85e6-2c0452d50138/cnpgs/7680cc58-8e5f-4be2-a8cc-99d31d197dd8/metrics'
    authorization:
      type: Bearer
      # Replace by your PGVecto.rs API Key
      credentials: pgrs-57cc0d484e7e1d00444201eexxxxxxxx 
```

You may also avoid including the token in your configuration file by loading it from a file. Please consult [the Prometheus documentation](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#scrape_config) for more information, specifically the `authorization` section of `scrape_config`.

## Prometheus quick start

Follow this part of the guide to quickly understand how to connect a Prometheus server to PGVecto.rs Cloud by example.

To quickly get up and running with a local Prometheus server, you can follow these steps:
- Install Docker
- Generate a PGVecto.rs API Key
- Create a file, docker-compose.yml, with the following content

```yaml
version: '3.7'
services:
    prometheus:
        image: prom/prometheus:v2.33.1
        volumes:
            - ./prometheus.yml:/etc/prometheus/prometheus.yml
        ports:
            - '9090:9090'
        command:
            - '--config.file=/etc/prometheus/prometheus.yml'
```

- Create a `file prometheus.yml` in the same directory with the Prometheus configuration. This should look like the configuration example in the previous section. Replace the target by your Postgres cluster metrics along with the token by your PGVecto.rs Cloud API Key.
- Run `docker-compose up`

Within 30 seconds, you should be able to see Prometheus is collecting the metrics if you access the local Prometheus server in your web browser here: `http://localhost:9090/targets`.

## Appendix

<details>
<summary>Click to view all metrics</summary>

:::tip
In addition to specific indicators of the Postgres cluster database, we also provide the overall metrics for your cluster, such as the total or used PGData size, cpu utilization, and memory usage.
:::

```shell{654-665}
# HELP cnpg_backends_max_tx_duration_seconds Maximum duration of a transaction in seconds
# TYPE cnpg_backends_max_tx_duration_seconds gauge
cnpg_backends_max_tx_duration_seconds{application_name="cnpg_metrics_exporter",datname="bb",state="active",usename="postgres"} 0
# HELP cnpg_backends_total Number of backends
# TYPE cnpg_backends_total gauge
cnpg_backends_total{application_name="cnpg_metrics_exporter",datname="bb",state="active",usename="postgres"} 1
# HELP cnpg_backends_waiting_total Total number of backends that are currently waiting on other queries
# TYPE cnpg_backends_waiting_total gauge
cnpg_backends_waiting_total 0
# HELP cnpg_collector_collection_duration_seconds Collection time duration in seconds
# TYPE cnpg_collector_collection_duration_seconds gauge
cnpg_collector_collection_duration_seconds{collector="Collect.cnpg"} 0.05290234
cnpg_collector_collection_duration_seconds{collector="Collect.up"} 0.002278657
# HELP cnpg_collector_collections_total Total number of times PostgreSQL was accessed for metrics.
# TYPE cnpg_collector_collections_total counter
cnpg_collector_collections_total 272
# HELP cnpg_collector_fencing_on 1 if the instance is fenced, 0 otherwise
# TYPE cnpg_collector_fencing_on gauge
cnpg_collector_fencing_on 0
# HELP cnpg_collector_first_recoverability_point The first point of recoverability for the cluster as a unix timestamp
# TYPE cnpg_collector_first_recoverability_point gauge
cnpg_collector_first_recoverability_point 1.733281603e+09
# HELP cnpg_collector_last_available_backup_timestamp The last available backup as a unix timestamp
# TYPE cnpg_collector_last_available_backup_timestamp gauge
cnpg_collector_last_available_backup_timestamp 1.733281603e+09
# HELP cnpg_collector_last_collection_error 1 if the last collection ended with error, 0 otherwise.
# TYPE cnpg_collector_last_collection_error gauge
cnpg_collector_last_collection_error 0
# HELP cnpg_collector_last_failed_backup_timestamp The last failed backup as a unix timestamp
# TYPE cnpg_collector_last_failed_backup_timestamp gauge
cnpg_collector_last_failed_backup_timestamp 0
# HELP cnpg_collector_lo_pages Estimated number of pages in the pg_largeobject table
# TYPE cnpg_collector_lo_pages gauge
cnpg_collector_lo_pages{datname="bb"} 0
cnpg_collector_lo_pages{datname="postgres"} 0
# HELP cnpg_collector_manual_switchover_required 1 if a manual switchover is required, 0 otherwise
# TYPE cnpg_collector_manual_switchover_required gauge
cnpg_collector_manual_switchover_required 0
# HELP cnpg_collector_nodes_used NodesUsed represents the count of distinct nodes accommodating the instances. A value of '-1' suggests that the metric is not available. A value of '1' suggests that all instances are hosted on a single node, implying the absence of High Availability (HA). Ideally this value should match the number of instances in the cluster.
# TYPE cnpg_collector_nodes_used gauge
cnpg_collector_nodes_used 1
# HELP cnpg_collector_pg_wal Total size in bytes of WAL segments in the '/var/lib/postgresql/data/pgdata/pg_wal' directory  computed as (wal_segment_size * count)
# TYPE cnpg_collector_pg_wal gauge
cnpg_collector_pg_wal{value="count"} 7
cnpg_collector_pg_wal{value="keep"} 32
cnpg_collector_pg_wal{value="max"} 512
cnpg_collector_pg_wal{value="min"} 128
cnpg_collector_pg_wal{value="size"} 1.17440512e+08
cnpg_collector_pg_wal{value="slots_max"} NaN
cnpg_collector_pg_wal{value="volume_max"} NaN
cnpg_collector_pg_wal{value="volume_size"} NaN
# HELP cnpg_collector_pg_wal_archive_status Number of WAL segments in the '/var/lib/postgresql/data/pgdata/pg_wal/archive_status' directory (ready, done)
# TYPE cnpg_collector_pg_wal_archive_status gauge
cnpg_collector_pg_wal_archive_status{value="done"} 7
cnpg_collector_pg_wal_archive_status{value="ready"} 0
# HELP cnpg_collector_postgres_version Postgres version
# TYPE cnpg_collector_postgres_version gauge
cnpg_collector_postgres_version{cluster="bb",full="16.5"} 16.5
# HELP cnpg_collector_replica_mode 1 if the cluster is in replica mode, 0 otherwise
# TYPE cnpg_collector_replica_mode gauge
cnpg_collector_replica_mode 0
# HELP cnpg_collector_sync_replicas Number of requested synchronous replicas (synchronous_standby_names)
# TYPE cnpg_collector_sync_replicas gauge
cnpg_collector_sync_replicas{value="expected"} 0
cnpg_collector_sync_replicas{value="max"} 0
cnpg_collector_sync_replicas{value="min"} 0
cnpg_collector_sync_replicas{value="observed"} 0
# HELP cnpg_collector_up 1 if PostgreSQL is up, 0 otherwise.
# TYPE cnpg_collector_up gauge
cnpg_collector_up{cluster="bb"} 1
# HELP cnpg_collector_wal_buffers_full Number of times WAL data was written to disk because WAL buffers became full. Only available on PG 14+
# TYPE cnpg_collector_wal_buffers_full gauge
cnpg_collector_wal_buffers_full{stats_reset="2024-12-04T03:05:50.40867Z"} 0
# HELP cnpg_collector_wal_bytes Total amount of WAL generated in bytes. Only available on PG 14+
# TYPE cnpg_collector_wal_bytes gauge
cnpg_collector_wal_bytes{stats_reset="2024-12-04T03:05:50.40867Z"} 1.3429908e+07
# HELP cnpg_collector_wal_fpi Total number of WAL full page images generated. Only available on PG 14+
# TYPE cnpg_collector_wal_fpi gauge
cnpg_collector_wal_fpi{stats_reset="2024-12-04T03:05:50.40867Z"} 1867
# HELP cnpg_collector_wal_records Total number of WAL records generated. Only available on PG 14+
# TYPE cnpg_collector_wal_records gauge
cnpg_collector_wal_records{stats_reset="2024-12-04T03:05:50.40867Z"} 32123
# HELP cnpg_collector_wal_sync Number of times WAL files were synced to disk via issue_xlog_fsync request (if fsync is on and wal_sync_method is either fdatasync, fsync or fsync_writethrough, otherwise zero). Only available on PG 14+
# TYPE cnpg_collector_wal_sync gauge
cnpg_collector_wal_sync{stats_reset="2024-12-04T03:05:50.40867Z"} 54
# HELP cnpg_collector_wal_sync_time Total amount of time spent syncing WAL files to disk via issue_xlog_fsync request, in milliseconds (if track_wal_io_timing is enabled, fsync is on, and wal_sync_method is either fdatasync, fsync or fsync_writethrough, otherwise zero). Only available on PG 14+
# TYPE cnpg_collector_wal_sync_time gauge
cnpg_collector_wal_sync_time{stats_reset="2024-12-04T03:05:50.40867Z"} 0
# HELP cnpg_collector_wal_write Number of times WAL buffers were written out to disk via XLogWrite request. Only available on PG 14+
# TYPE cnpg_collector_wal_write gauge
cnpg_collector_wal_write{stats_reset="2024-12-04T03:05:50.40867Z"} 792
# HELP cnpg_collector_wal_write_time Total amount of time spent writing WAL buffers to disk via XLogWrite request, in milliseconds (if track_wal_io_timing is enabled, otherwise zero). This includes the sync time when wal_sync_method is either open_datasync or open_sync. Only available on PG 14+
# TYPE cnpg_collector_wal_write_time gauge
cnpg_collector_wal_write_time{stats_reset="2024-12-04T03:05:50.40867Z"} 0
# HELP cnpg_last_error 1 if the last collection ended with error, 0 otherwise.
# TYPE cnpg_last_error gauge
cnpg_last_error 0
# HELP cnpg_pg_database_mxid_age Number of multiple transactions (Multixact) from the frozen XID to the current one
# TYPE cnpg_pg_database_mxid_age gauge
cnpg_pg_database_mxid_age{datname="bb"} 0
cnpg_pg_database_mxid_age{datname="postgres"} 0
cnpg_pg_database_mxid_age{datname="template0"} 0
cnpg_pg_database_mxid_age{datname="template1"} 0
# HELP cnpg_pg_database_size_bytes Disk space used by the database
# TYPE cnpg_pg_database_size_bytes gauge
cnpg_pg_database_size_bytes{datname="bb"} 7.934435e+06
cnpg_pg_database_size_bytes{datname="postgres"} 7.688675e+06
cnpg_pg_database_size_bytes{datname="template0"} 7.504399e+06
cnpg_pg_database_size_bytes{datname="template1"} 7.754211e+06
# HELP cnpg_pg_database_xid_age Number of transactions from the frozen XID to the current one
# TYPE cnpg_pg_database_xid_age gauge
cnpg_pg_database_xid_age{datname="bb"} 34
cnpg_pg_database_xid_age{datname="postgres"} 34
cnpg_pg_database_xid_age{datname="template0"} 34
cnpg_pg_database_xid_age{datname="template1"} 34
# HELP cnpg_pg_postmaster_start_time Time at which postgres started (based on epoch)
# TYPE cnpg_pg_postmaster_start_time gauge
cnpg_pg_postmaster_start_time 1.733281559515339e+09
# HELP cnpg_pg_replication_in_recovery Whether the instance is in recovery
# TYPE cnpg_pg_replication_in_recovery gauge
cnpg_pg_replication_in_recovery 0
# HELP cnpg_pg_replication_is_wal_receiver_up Whether the instance wal_receiver is up
# TYPE cnpg_pg_replication_is_wal_receiver_up gauge
cnpg_pg_replication_is_wal_receiver_up 0
# HELP cnpg_pg_replication_lag Replication lag behind primary in seconds
# TYPE cnpg_pg_replication_lag gauge
cnpg_pg_replication_lag 0
# HELP cnpg_pg_replication_streaming_replicas Number of streaming replicas connected to the instance
# TYPE cnpg_pg_replication_streaming_replicas gauge
cnpg_pg_replication_streaming_replicas 0
# HELP cnpg_pg_settings_setting Setting value
# TYPE cnpg_pg_settings_setting gauge
cnpg_pg_settings_setting{name="allow_in_place_tablespaces"} 0
cnpg_pg_settings_setting{name="allow_system_table_mods"} 0
cnpg_pg_settings_setting{name="archive_timeout"} 300
cnpg_pg_settings_setting{name="array_nulls"} 1
cnpg_pg_settings_setting{name="authentication_timeout"} 60
cnpg_pg_settings_setting{name="autovacuum"} 1
cnpg_pg_settings_setting{name="autovacuum_analyze_scale_factor"} 0.1
cnpg_pg_settings_setting{name="autovacuum_analyze_threshold"} 50
cnpg_pg_settings_setting{name="autovacuum_freeze_max_age"} 2e+08
cnpg_pg_settings_setting{name="autovacuum_max_workers"} 3
cnpg_pg_settings_setting{name="autovacuum_multixact_freeze_max_age"} 4e+08
cnpg_pg_settings_setting{name="autovacuum_naptime"} 60
cnpg_pg_settings_setting{name="autovacuum_vacuum_cost_delay"} 2
cnpg_pg_settings_setting{name="autovacuum_vacuum_cost_limit"} -1
cnpg_pg_settings_setting{name="autovacuum_vacuum_insert_scale_factor"} 0.2
cnpg_pg_settings_setting{name="autovacuum_vacuum_insert_threshold"} 1000
cnpg_pg_settings_setting{name="autovacuum_vacuum_scale_factor"} 0.2
cnpg_pg_settings_setting{name="autovacuum_vacuum_threshold"} 50
cnpg_pg_settings_setting{name="autovacuum_work_mem"} -1
cnpg_pg_settings_setting{name="backend_flush_after"} 0
cnpg_pg_settings_setting{name="bgwriter_delay"} 200
cnpg_pg_settings_setting{name="bgwriter_flush_after"} 64
cnpg_pg_settings_setting{name="bgwriter_lru_maxpages"} 100
cnpg_pg_settings_setting{name="bgwriter_lru_multiplier"} 2
cnpg_pg_settings_setting{name="block_size"} 8192
cnpg_pg_settings_setting{name="bonjour"} 0
cnpg_pg_settings_setting{name="check_function_bodies"} 1
cnpg_pg_settings_setting{name="checkpoint_completion_target"} 0.9
cnpg_pg_settings_setting{name="checkpoint_flush_after"} 32
cnpg_pg_settings_setting{name="checkpoint_timeout"} 1800
cnpg_pg_settings_setting{name="checkpoint_warning"} 30
cnpg_pg_settings_setting{name="client_connection_check_interval"} 0
cnpg_pg_settings_setting{name="commit_delay"} 0
cnpg_pg_settings_setting{name="commit_siblings"} 5
cnpg_pg_settings_setting{name="cpu_index_tuple_cost"} 0.005
cnpg_pg_settings_setting{name="cpu_operator_cost"} 0.0025
cnpg_pg_settings_setting{name="cpu_tuple_cost"} 0.01
cnpg_pg_settings_setting{name="cursor_tuple_fraction"} 0.1
cnpg_pg_settings_setting{name="data_checksums"} 1
cnpg_pg_settings_setting{name="data_directory_mode"} 700
cnpg_pg_settings_setting{name="data_sync_retry"} 0
cnpg_pg_settings_setting{name="db_user_namespace"} 0
cnpg_pg_settings_setting{name="deadlock_timeout"} 1000
cnpg_pg_settings_setting{name="debug_assertions"} 0
cnpg_pg_settings_setting{name="debug_discard_caches"} 0
cnpg_pg_settings_setting{name="debug_pretty_print"} 1
cnpg_pg_settings_setting{name="debug_print_parse"} 0
cnpg_pg_settings_setting{name="debug_print_plan"} 0
cnpg_pg_settings_setting{name="debug_print_rewritten"} 0
cnpg_pg_settings_setting{name="default_statistics_target"} 100
cnpg_pg_settings_setting{name="default_transaction_deferrable"} 0
cnpg_pg_settings_setting{name="default_transaction_read_only"} 0
cnpg_pg_settings_setting{name="effective_cache_size"} 786432
cnpg_pg_settings_setting{name="effective_io_concurrency"} 200
cnpg_pg_settings_setting{name="enable_async_append"} 1
cnpg_pg_settings_setting{name="enable_bitmapscan"} 1
cnpg_pg_settings_setting{name="enable_gathermerge"} 1
cnpg_pg_settings_setting{name="enable_hashagg"} 1
cnpg_pg_settings_setting{name="enable_hashjoin"} 1
cnpg_pg_settings_setting{name="enable_incremental_sort"} 1
cnpg_pg_settings_setting{name="enable_indexonlyscan"} 1
cnpg_pg_settings_setting{name="enable_indexscan"} 1
cnpg_pg_settings_setting{name="enable_material"} 1
cnpg_pg_settings_setting{name="enable_memoize"} 1
cnpg_pg_settings_setting{name="enable_mergejoin"} 1
cnpg_pg_settings_setting{name="enable_nestloop"} 1
cnpg_pg_settings_setting{name="enable_parallel_append"} 1
cnpg_pg_settings_setting{name="enable_parallel_hash"} 1
cnpg_pg_settings_setting{name="enable_partition_pruning"} 1
cnpg_pg_settings_setting{name="enable_partitionwise_aggregate"} 0
cnpg_pg_settings_setting{name="enable_partitionwise_join"} 0
cnpg_pg_settings_setting{name="enable_presorted_aggregate"} 1
cnpg_pg_settings_setting{name="enable_seqscan"} 1
cnpg_pg_settings_setting{name="enable_sort"} 1
cnpg_pg_settings_setting{name="enable_tidscan"} 1
cnpg_pg_settings_setting{name="escape_string_warning"} 1
cnpg_pg_settings_setting{name="exit_on_error"} 0
cnpg_pg_settings_setting{name="extra_float_digits"} 1
cnpg_pg_settings_setting{name="from_collapse_limit"} 8
cnpg_pg_settings_setting{name="fsync"} 1
cnpg_pg_settings_setting{name="full_page_writes"} 1
cnpg_pg_settings_setting{name="geqo"} 1
cnpg_pg_settings_setting{name="geqo_effort"} 5
cnpg_pg_settings_setting{name="geqo_generations"} 0
cnpg_pg_settings_setting{name="geqo_pool_size"} 0
cnpg_pg_settings_setting{name="geqo_seed"} 0
cnpg_pg_settings_setting{name="geqo_selection_bias"} 2
cnpg_pg_settings_setting{name="geqo_threshold"} 12
cnpg_pg_settings_setting{name="gin_fuzzy_search_limit"} 0
cnpg_pg_settings_setting{name="gin_pending_list_limit"} 4096
cnpg_pg_settings_setting{name="gss_accept_delegation"} 0
cnpg_pg_settings_setting{name="hash_mem_multiplier"} 2
cnpg_pg_settings_setting{name="hot_standby"} 1
cnpg_pg_settings_setting{name="hot_standby_feedback"} 0
cnpg_pg_settings_setting{name="huge_page_size"} 0
cnpg_pg_settings_setting{name="idle_in_transaction_session_timeout"} 0
cnpg_pg_settings_setting{name="idle_session_timeout"} 0
cnpg_pg_settings_setting{name="ignore_checksum_failure"} 0
cnpg_pg_settings_setting{name="ignore_invalid_pages"} 0
cnpg_pg_settings_setting{name="ignore_system_indexes"} 0
cnpg_pg_settings_setting{name="in_hot_standby"} 0
cnpg_pg_settings_setting{name="integer_datetimes"} 1
cnpg_pg_settings_setting{name="jit"} 1
cnpg_pg_settings_setting{name="jit_above_cost"} 100000
cnpg_pg_settings_setting{name="jit_debugging_support"} 0
cnpg_pg_settings_setting{name="jit_dump_bitcode"} 0
cnpg_pg_settings_setting{name="jit_expressions"} 1
cnpg_pg_settings_setting{name="jit_inline_above_cost"} 500000
cnpg_pg_settings_setting{name="jit_optimize_above_cost"} 500000
cnpg_pg_settings_setting{name="jit_profiling_support"} 0
cnpg_pg_settings_setting{name="jit_tuple_deforming"} 1
cnpg_pg_settings_setting{name="join_collapse_limit"} 8
cnpg_pg_settings_setting{name="krb_caseins_users"} 0
cnpg_pg_settings_setting{name="lo_compat_privileges"} 0
cnpg_pg_settings_setting{name="lock_timeout"} 0
cnpg_pg_settings_setting{name="log_autovacuum_min_duration"} 600000
cnpg_pg_settings_setting{name="log_checkpoints"} 1
cnpg_pg_settings_setting{name="log_connections"} 0
cnpg_pg_settings_setting{name="log_disconnections"} 0
cnpg_pg_settings_setting{name="log_duration"} 0
cnpg_pg_settings_setting{name="log_executor_stats"} 0
cnpg_pg_settings_setting{name="log_file_mode"} 600
cnpg_pg_settings_setting{name="log_hostname"} 0
cnpg_pg_settings_setting{name="log_lock_waits"} 0
cnpg_pg_settings_setting{name="log_min_duration_sample"} -1
cnpg_pg_settings_setting{name="log_min_duration_statement"} -1
cnpg_pg_settings_setting{name="log_parameter_max_length"} -1
cnpg_pg_settings_setting{name="log_parameter_max_length_on_error"} 0
cnpg_pg_settings_setting{name="log_parser_stats"} 0
cnpg_pg_settings_setting{name="log_planner_stats"} 0
cnpg_pg_settings_setting{name="log_recovery_conflict_waits"} 0
cnpg_pg_settings_setting{name="log_replication_commands"} 0
cnpg_pg_settings_setting{name="log_rotation_age"} 0
cnpg_pg_settings_setting{name="log_rotation_size"} 0
cnpg_pg_settings_setting{name="log_startup_progress_interval"} 10000
cnpg_pg_settings_setting{name="log_statement_sample_rate"} 1
cnpg_pg_settings_setting{name="log_statement_stats"} 0
cnpg_pg_settings_setting{name="log_temp_files"} -1
cnpg_pg_settings_setting{name="log_transaction_sample_rate"} 0
cnpg_pg_settings_setting{name="log_truncate_on_rotation"} 0
cnpg_pg_settings_setting{name="logging_collector"} 1
cnpg_pg_settings_setting{name="logical_decoding_work_mem"} 65536
cnpg_pg_settings_setting{name="maintenance_io_concurrency"} 10
cnpg_pg_settings_setting{name="maintenance_work_mem"} 524288
cnpg_pg_settings_setting{name="max_connections"} 100
cnpg_pg_settings_setting{name="max_files_per_process"} 1000
cnpg_pg_settings_setting{name="max_function_args"} 100
cnpg_pg_settings_setting{name="max_identifier_length"} 63
cnpg_pg_settings_setting{name="max_index_keys"} 32
cnpg_pg_settings_setting{name="max_locks_per_transaction"} 64
cnpg_pg_settings_setting{name="max_logical_replication_workers"} 4
cnpg_pg_settings_setting{name="max_parallel_apply_workers_per_subscription"} 2
cnpg_pg_settings_setting{name="max_parallel_maintenance_workers"} 1
cnpg_pg_settings_setting{name="max_parallel_workers"} 2
cnpg_pg_settings_setting{name="max_parallel_workers_per_gather"} 1
cnpg_pg_settings_setting{name="max_pred_locks_per_page"} 2
cnpg_pg_settings_setting{name="max_pred_locks_per_relation"} -2
cnpg_pg_settings_setting{name="max_pred_locks_per_transaction"} 64
cnpg_pg_settings_setting{name="max_prepared_transactions"} 0
cnpg_pg_settings_setting{name="max_replication_slots"} 32
cnpg_pg_settings_setting{name="max_slot_wal_keep_size"} -1
cnpg_pg_settings_setting{name="max_stack_depth"} 2048
cnpg_pg_settings_setting{name="max_standby_archive_delay"} 30000
cnpg_pg_settings_setting{name="max_standby_streaming_delay"} 30000
cnpg_pg_settings_setting{name="max_sync_workers_per_subscription"} 2
cnpg_pg_settings_setting{name="max_wal_senders"} 10
cnpg_pg_settings_setting{name="max_wal_size"} 8192
cnpg_pg_settings_setting{name="max_worker_processes"} 2
cnpg_pg_settings_setting{name="min_dynamic_shared_memory"} 0
cnpg_pg_settings_setting{name="min_parallel_index_scan_size"} 64
cnpg_pg_settings_setting{name="min_parallel_table_scan_size"} 1024
cnpg_pg_settings_setting{name="min_wal_size"} 2048
cnpg_pg_settings_setting{name="old_snapshot_threshold"} -1
cnpg_pg_settings_setting{name="parallel_leader_participation"} 1
cnpg_pg_settings_setting{name="parallel_setup_cost"} 1000
cnpg_pg_settings_setting{name="parallel_tuple_cost"} 0.1
cnpg_pg_settings_setting{name="pgaudit.log_catalog"} 0
cnpg_pg_settings_setting{name="pgaudit.log_client"} 0
cnpg_pg_settings_setting{name="pgaudit.log_parameter"} 1
cnpg_pg_settings_setting{name="pgaudit.log_parameter_max_size"} 0
cnpg_pg_settings_setting{name="pgaudit.log_relation"} 1
cnpg_pg_settings_setting{name="pgaudit.log_rows"} 0
cnpg_pg_settings_setting{name="pgaudit.log_statement"} 1
cnpg_pg_settings_setting{name="pgaudit.log_statement_once"} 0
cnpg_pg_settings_setting{name="port"} 5432
cnpg_pg_settings_setting{name="post_auth_delay"} 0
cnpg_pg_settings_setting{name="pre_auth_delay"} 0
cnpg_pg_settings_setting{name="quote_all_identifiers"} 0
cnpg_pg_settings_setting{name="random_page_cost"} 1.1
cnpg_pg_settings_setting{name="recovery_min_apply_delay"} 0
cnpg_pg_settings_setting{name="recovery_target_inclusive"} 1
cnpg_pg_settings_setting{name="recursive_worktable_factor"} 10
cnpg_pg_settings_setting{name="remove_temp_files_after_crash"} 1
cnpg_pg_settings_setting{name="reserved_connections"} 0
cnpg_pg_settings_setting{name="restart_after_crash"} 0
cnpg_pg_settings_setting{name="row_security"} 1
cnpg_pg_settings_setting{name="scram_iterations"} 4096
cnpg_pg_settings_setting{name="segment_size"} 131072
cnpg_pg_settings_setting{name="send_abort_for_crash"} 0
cnpg_pg_settings_setting{name="send_abort_for_kill"} 0
cnpg_pg_settings_setting{name="seq_page_cost"} 1
cnpg_pg_settings_setting{name="server_version_num"} 160005
cnpg_pg_settings_setting{name="shared_buffers"} 262144
cnpg_pg_settings_setting{name="shared_memory_size"} 2120
cnpg_pg_settings_setting{name="shared_memory_size_in_huge_pages"} 1060
cnpg_pg_settings_setting{name="ssl"} 1
cnpg_pg_settings_setting{name="ssl_passphrase_command_supports_reload"} 0
cnpg_pg_settings_setting{name="ssl_prefer_server_ciphers"} 1
cnpg_pg_settings_setting{name="standard_conforming_strings"} 1
cnpg_pg_settings_setting{name="statement_timeout"} 0
cnpg_pg_settings_setting{name="superuser_reserved_connections"} 3
cnpg_pg_settings_setting{name="synchronize_seqscans"} 1
cnpg_pg_settings_setting{name="syslog_sequence_numbers"} 1
cnpg_pg_settings_setting{name="syslog_split_messages"} 1
cnpg_pg_settings_setting{name="tcp_keepalives_count"} 0
cnpg_pg_settings_setting{name="tcp_keepalives_idle"} 0
cnpg_pg_settings_setting{name="tcp_keepalives_interval"} 0
cnpg_pg_settings_setting{name="tcp_user_timeout"} 0
cnpg_pg_settings_setting{name="temp_buffers"} 1024
cnpg_pg_settings_setting{name="temp_file_limit"} -1
cnpg_pg_settings_setting{name="trace_notify"} 0
cnpg_pg_settings_setting{name="trace_sort"} 0
cnpg_pg_settings_setting{name="track_activities"} 1
cnpg_pg_settings_setting{name="track_activity_query_size"} 1024
cnpg_pg_settings_setting{name="track_commit_timestamp"} 0
cnpg_pg_settings_setting{name="track_counts"} 1
cnpg_pg_settings_setting{name="track_io_timing"} 0
cnpg_pg_settings_setting{name="track_wal_io_timing"} 0
cnpg_pg_settings_setting{name="transaction_deferrable"} 0
cnpg_pg_settings_setting{name="transaction_read_only"} 1
cnpg_pg_settings_setting{name="transform_null_equals"} 0
cnpg_pg_settings_setting{name="unix_socket_permissions"} 777
cnpg_pg_settings_setting{name="update_process_title"} 1
cnpg_pg_settings_setting{name="vacuum_buffer_usage_limit"} 256
cnpg_pg_settings_setting{name="vacuum_cost_delay"} 0
cnpg_pg_settings_setting{name="vacuum_cost_limit"} 200
cnpg_pg_settings_setting{name="vacuum_cost_page_dirty"} 20
cnpg_pg_settings_setting{name="vacuum_cost_page_hit"} 1
cnpg_pg_settings_setting{name="vacuum_cost_page_miss"} 2
cnpg_pg_settings_setting{name="vacuum_failsafe_age"} 1.6e+09
cnpg_pg_settings_setting{name="vacuum_freeze_min_age"} 5e+07
cnpg_pg_settings_setting{name="vacuum_freeze_table_age"} 1.5e+08
cnpg_pg_settings_setting{name="vacuum_multixact_failsafe_age"} 1.6e+09
cnpg_pg_settings_setting{name="vacuum_multixact_freeze_min_age"} 5e+06
cnpg_pg_settings_setting{name="vacuum_multixact_freeze_table_age"} 1.5e+08
cnpg_pg_settings_setting{name="vectors.enable_index"} 1
cnpg_pg_settings_setting{name="vectors.hnsw_ef_search"} 100
cnpg_pg_settings_setting{name="vectors.ivf_nprobe"} 10
cnpg_pg_settings_setting{name="vectors.pgvector_compatibility"} 1
cnpg_pg_settings_setting{name="vectors.pq_fast_scan"} 0
cnpg_pg_settings_setting{name="vectors.pq_rerank_size"} 0
cnpg_pg_settings_setting{name="vectors.rq_fast_scan"} 0
cnpg_pg_settings_setting{name="vectors.sq_fast_scan"} 0
cnpg_pg_settings_setting{name="vectors.sq_rerank_size"} 0
cnpg_pg_settings_setting{name="wal_block_size"} 8192
cnpg_pg_settings_setting{name="wal_buffers"} 2048
cnpg_pg_settings_setting{name="wal_decode_buffer_size"} 524288
cnpg_pg_settings_setting{name="wal_init_zero"} 1
cnpg_pg_settings_setting{name="wal_keep_size"} 512
cnpg_pg_settings_setting{name="wal_log_hints"} 1
cnpg_pg_settings_setting{name="wal_receiver_create_temp_slot"} 0
cnpg_pg_settings_setting{name="wal_receiver_status_interval"} 10
cnpg_pg_settings_setting{name="wal_receiver_timeout"} 5000
cnpg_pg_settings_setting{name="wal_recycle"} 1
cnpg_pg_settings_setting{name="wal_retrieve_retry_interval"} 5000
cnpg_pg_settings_setting{name="wal_segment_size"} 1.6777216e+07
cnpg_pg_settings_setting{name="wal_sender_timeout"} 5000
cnpg_pg_settings_setting{name="wal_skip_threshold"} 2048
cnpg_pg_settings_setting{name="wal_writer_delay"} 200
cnpg_pg_settings_setting{name="wal_writer_flush_after"} 128
cnpg_pg_settings_setting{name="work_mem"} 20971
cnpg_pg_settings_setting{name="zero_damaged_pages"} 0
# HELP cnpg_pg_stat_archiver_archived_count Number of WAL files that have been successfully archived
# TYPE cnpg_pg_stat_archiver_archived_count counter
cnpg_pg_stat_archiver_archived_count 7
# HELP cnpg_pg_stat_archiver_failed_count Number of failed attempts for archiving WAL files
# TYPE cnpg_pg_stat_archiver_failed_count counter
cnpg_pg_stat_archiver_failed_count 0
# HELP cnpg_pg_stat_archiver_last_archived_time Epoch of the last time WAL archiving succeeded
# TYPE cnpg_pg_stat_archiver_last_archived_time gauge
cnpg_pg_stat_archiver_last_archived_time 1.733283406713513e+09
# HELP cnpg_pg_stat_archiver_last_archived_wal_start_lsn Archived WAL start LSN
# TYPE cnpg_pg_stat_archiver_last_archived_wal_start_lsn gauge
cnpg_pg_stat_archiver_last_archived_wal_start_lsn 6
# HELP cnpg_pg_stat_archiver_last_failed_time Epoch of the last time WAL archiving failed
# TYPE cnpg_pg_stat_archiver_last_failed_time gauge
cnpg_pg_stat_archiver_last_failed_time -1
# HELP cnpg_pg_stat_archiver_last_failed_wal_start_lsn Last failed WAL LSN
# TYPE cnpg_pg_stat_archiver_last_failed_wal_start_lsn gauge
cnpg_pg_stat_archiver_last_failed_wal_start_lsn -1
# HELP cnpg_pg_stat_archiver_seconds_since_last_archival Seconds since the last successful archival operation
# TYPE cnpg_pg_stat_archiver_seconds_since_last_archival gauge
cnpg_pg_stat_archiver_seconds_since_last_archival 6104.299629
# HELP cnpg_pg_stat_archiver_seconds_since_last_failure Seconds since the last failed archival operation
# TYPE cnpg_pg_stat_archiver_seconds_since_last_failure gauge
cnpg_pg_stat_archiver_seconds_since_last_failure -1
# HELP cnpg_pg_stat_archiver_stats_reset_time Time at which these statistics were last reset
# TYPE cnpg_pg_stat_archiver_stats_reset_time gauge
cnpg_pg_stat_archiver_stats_reset_time 1.73328155040867e+09
# HELP cnpg_pg_stat_bgwriter_buffers_alloc Number of buffers allocated
# TYPE cnpg_pg_stat_bgwriter_buffers_alloc counter
cnpg_pg_stat_bgwriter_buffers_alloc 2770
# HELP cnpg_pg_stat_bgwriter_buffers_backend Number of buffers written directly by a backend
# TYPE cnpg_pg_stat_bgwriter_buffers_backend counter
cnpg_pg_stat_bgwriter_buffers_backend 346
# HELP cnpg_pg_stat_bgwriter_buffers_backend_fsync Number of times a backend had to execute its own fsync call (normally the background writer handles those even when the backend does its own write)
# TYPE cnpg_pg_stat_bgwriter_buffers_backend_fsync counter
cnpg_pg_stat_bgwriter_buffers_backend_fsync 0
# HELP cnpg_pg_stat_bgwriter_buffers_checkpoint Number of buffers written during checkpoints
# TYPE cnpg_pg_stat_bgwriter_buffers_checkpoint counter
cnpg_pg_stat_bgwriter_buffers_checkpoint 1145
# HELP cnpg_pg_stat_bgwriter_buffers_clean Number of buffers written by the background writer
# TYPE cnpg_pg_stat_bgwriter_buffers_clean counter
cnpg_pg_stat_bgwriter_buffers_clean 0
# HELP cnpg_pg_stat_bgwriter_checkpoint_sync_time Total amount of time that has been spent in the portion of checkpoint processing where files are synchronized to disk, in milliseconds
# TYPE cnpg_pg_stat_bgwriter_checkpoint_sync_time counter
cnpg_pg_stat_bgwriter_checkpoint_sync_time 11
# HELP cnpg_pg_stat_bgwriter_checkpoint_write_time Total amount of time that has been spent in the portion of checkpoint processing where files are written to disk, in milliseconds
# TYPE cnpg_pg_stat_bgwriter_checkpoint_write_time counter
cnpg_pg_stat_bgwriter_checkpoint_write_time 18902
# HELP cnpg_pg_stat_bgwriter_checkpoints_req Number of requested checkpoints that have been performed
# TYPE cnpg_pg_stat_bgwriter_checkpoints_req counter
cnpg_pg_stat_bgwriter_checkpoints_req 2
# HELP cnpg_pg_stat_bgwriter_checkpoints_timed Number of scheduled checkpoints that have been performed
# TYPE cnpg_pg_stat_bgwriter_checkpoints_timed counter
cnpg_pg_stat_bgwriter_checkpoints_timed 4
# HELP cnpg_pg_stat_bgwriter_maxwritten_clean Number of times the background writer stopped a cleaning scan because it had written too many buffers
# TYPE cnpg_pg_stat_bgwriter_maxwritten_clean counter
cnpg_pg_stat_bgwriter_maxwritten_clean 0
# HELP cnpg_pg_stat_database_blk_read_time Time spent reading data file blocks by backends in this database, in milliseconds
# TYPE cnpg_pg_stat_database_blk_read_time counter
cnpg_pg_stat_database_blk_read_time{datname=""} 0
cnpg_pg_stat_database_blk_read_time{datname="bb"} 0
cnpg_pg_stat_database_blk_read_time{datname="postgres"} 0
cnpg_pg_stat_database_blk_read_time{datname="template0"} 0
cnpg_pg_stat_database_blk_read_time{datname="template1"} 0
# HELP cnpg_pg_stat_database_blk_write_time Time spent writing data file blocks by backends in this database, in milliseconds
# TYPE cnpg_pg_stat_database_blk_write_time counter
cnpg_pg_stat_database_blk_write_time{datname=""} 0
cnpg_pg_stat_database_blk_write_time{datname="bb"} 0
cnpg_pg_stat_database_blk_write_time{datname="postgres"} 0
cnpg_pg_stat_database_blk_write_time{datname="template0"} 0
cnpg_pg_stat_database_blk_write_time{datname="template1"} 0
# HELP cnpg_pg_stat_database_blks_hit Number of times disk blocks were found already in the buffer cache, so that a read was not necessary (this only includes hits in the PostgreSQL buffer cache, not the operating system's file system cache)
# TYPE cnpg_pg_stat_database_blks_hit counter
cnpg_pg_stat_database_blks_hit{datname=""} 195433
cnpg_pg_stat_database_blks_hit{datname="bb"} 1.284724e+06
cnpg_pg_stat_database_blks_hit{datname="postgres"} 226804
cnpg_pg_stat_database_blks_hit{datname="template0"} 0
cnpg_pg_stat_database_blks_hit{datname="template1"} 99880
# HELP cnpg_pg_stat_database_blks_read Number of disk blocks read in this database
# TYPE cnpg_pg_stat_database_blks_read counter
cnpg_pg_stat_database_blks_read{datname=""} 94
cnpg_pg_stat_database_blks_read{datname="bb"} 316
cnpg_pg_stat_database_blks_read{datname="postgres"} 402
cnpg_pg_stat_database_blks_read{datname="template0"} 0
cnpg_pg_stat_database_blks_read{datname="template1"} 891
# HELP cnpg_pg_stat_database_conflicts Number of queries canceled due to conflicts with recovery in this database
# TYPE cnpg_pg_stat_database_conflicts counter
cnpg_pg_stat_database_conflicts{datname=""} 0
cnpg_pg_stat_database_conflicts{datname="bb"} 0
cnpg_pg_stat_database_conflicts{datname="postgres"} 0
cnpg_pg_stat_database_conflicts{datname="template0"} 0
cnpg_pg_stat_database_conflicts{datname="template1"} 0
# HELP cnpg_pg_stat_database_deadlocks Number of deadlocks detected in this database
# TYPE cnpg_pg_stat_database_deadlocks counter
cnpg_pg_stat_database_deadlocks{datname=""} 0
cnpg_pg_stat_database_deadlocks{datname="bb"} 0
cnpg_pg_stat_database_deadlocks{datname="postgres"} 0
cnpg_pg_stat_database_deadlocks{datname="template0"} 0
cnpg_pg_stat_database_deadlocks{datname="template1"} 0
# HELP cnpg_pg_stat_database_temp_bytes Total amount of data written to temporary files by queries in this database
# TYPE cnpg_pg_stat_database_temp_bytes counter
cnpg_pg_stat_database_temp_bytes{datname=""} 0
cnpg_pg_stat_database_temp_bytes{datname="bb"} 0
cnpg_pg_stat_database_temp_bytes{datname="postgres"} 0
cnpg_pg_stat_database_temp_bytes{datname="template0"} 0
cnpg_pg_stat_database_temp_bytes{datname="template1"} 0
# HELP cnpg_pg_stat_database_temp_files Number of temporary files created by queries in this database
# TYPE cnpg_pg_stat_database_temp_files counter
cnpg_pg_stat_database_temp_files{datname=""} 0
cnpg_pg_stat_database_temp_files{datname="bb"} 0
cnpg_pg_stat_database_temp_files{datname="postgres"} 0
cnpg_pg_stat_database_temp_files{datname="template0"} 0
cnpg_pg_stat_database_temp_files{datname="template1"} 0
# HELP cnpg_pg_stat_database_tup_deleted Number of rows deleted by queries in this database
# TYPE cnpg_pg_stat_database_tup_deleted counter
cnpg_pg_stat_database_tup_deleted{datname=""} 0
cnpg_pg_stat_database_tup_deleted{datname="bb"} 41
cnpg_pg_stat_database_tup_deleted{datname="postgres"} 0
cnpg_pg_stat_database_tup_deleted{datname="template0"} 0
cnpg_pg_stat_database_tup_deleted{datname="template1"} 34
# HELP cnpg_pg_stat_database_tup_fetched Number of rows fetched by queries in this database
# TYPE cnpg_pg_stat_database_tup_fetched counter
cnpg_pg_stat_database_tup_fetched{datname=""} 51500
cnpg_pg_stat_database_tup_fetched{datname="bb"} 807164
cnpg_pg_stat_database_tup_fetched{datname="postgres"} 121616
cnpg_pg_stat_database_tup_fetched{datname="template0"} 0
cnpg_pg_stat_database_tup_fetched{datname="template1"} 29147
# HELP cnpg_pg_stat_database_tup_inserted Number of rows inserted by queries in this database
# TYPE cnpg_pg_stat_database_tup_inserted counter
cnpg_pg_stat_database_tup_inserted{datname=""} 36
cnpg_pg_stat_database_tup_inserted{datname="bb"} 1401
cnpg_pg_stat_database_tup_inserted{datname="postgres"} 15
cnpg_pg_stat_database_tup_inserted{datname="template0"} 0
cnpg_pg_stat_database_tup_inserted{datname="template1"} 17593
# HELP cnpg_pg_stat_database_tup_returned Number of rows returned by queries in this database
# TYPE cnpg_pg_stat_database_tup_returned counter
cnpg_pg_stat_database_tup_returned{datname=""} 60743
cnpg_pg_stat_database_tup_returned{datname="bb"} 1.045589e+06
cnpg_pg_stat_database_tup_returned{datname="postgres"} 240174
cnpg_pg_stat_database_tup_returned{datname="template0"} 0
cnpg_pg_stat_database_tup_returned{datname="template1"} 191401
# HELP cnpg_pg_stat_database_tup_updated Number of rows updated by queries in this database
# TYPE cnpg_pg_stat_database_tup_updated counter
cnpg_pg_stat_database_tup_updated{datname=""} 7
cnpg_pg_stat_database_tup_updated{datname="bb"} 107
cnpg_pg_stat_database_tup_updated{datname="postgres"} 4
cnpg_pg_stat_database_tup_updated{datname="template0"} 0
cnpg_pg_stat_database_tup_updated{datname="template1"} 754
# HELP cnpg_pg_stat_database_xact_commit Number of transactions in this database that have been committed
# TYPE cnpg_pg_stat_database_xact_commit counter
cnpg_pg_stat_database_xact_commit{datname=""} 0
cnpg_pg_stat_database_xact_commit{datname="bb"} 7887
cnpg_pg_stat_database_xact_commit{datname="postgres"} 5928
cnpg_pg_stat_database_xact_commit{datname="template0"} 0
cnpg_pg_stat_database_xact_commit{datname="template1"} 1177
# HELP cnpg_pg_stat_database_xact_rollback Number of transactions in this database that have been rolled back
# TYPE cnpg_pg_stat_database_xact_rollback counter
cnpg_pg_stat_database_xact_rollback{datname=""} 0
cnpg_pg_stat_database_xact_rollback{datname="bb"} 0
cnpg_pg_stat_database_xact_rollback{datname="postgres"} 0
cnpg_pg_stat_database_xact_rollback{datname="template0"} 0
cnpg_pg_stat_database_xact_rollback{datname="template1"} 0
# HELP go_gc_duration_seconds A summary of the pause duration of garbage collection cycles.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 1.6777e-05
go_gc_duration_seconds{quantile="0.25"} 4.737e-05
go_gc_duration_seconds{quantile="0.5"} 6.074e-05
go_gc_duration_seconds{quantile="0.75"} 7.1193e-05
go_gc_duration_seconds{quantile="1"} 0.000370254
go_gc_duration_seconds_sum 0.005222777
go_gc_duration_seconds_count 76
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 77
# HELP go_info Information about the Go environment.
# TYPE go_info gauge
go_info{version="go1.22.4"} 1
# HELP go_memstats_alloc_bytes Number of bytes allocated and still in use.
# TYPE go_memstats_alloc_bytes gauge
go_memstats_alloc_bytes 7.9226e+06
# HELP go_memstats_alloc_bytes_total Total number of bytes allocated, even if freed.
# TYPE go_memstats_alloc_bytes_total counter
go_memstats_alloc_bytes_total 3.23233208e+08
# HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table.
# TYPE go_memstats_buck_hash_sys_bytes gauge
go_memstats_buck_hash_sys_bytes 1.532818e+06
# HELP go_memstats_frees_total Total number of frees.
# TYPE go_memstats_frees_total counter
go_memstats_frees_total 3.568269e+06
# HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata.
# TYPE go_memstats_gc_sys_bytes gauge
go_memstats_gc_sys_bytes 3.737056e+06
# HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and still in use.
# TYPE go_memstats_heap_alloc_bytes gauge
go_memstats_heap_alloc_bytes 7.9226e+06
# HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used.
# TYPE go_memstats_heap_idle_bytes gauge
go_memstats_heap_idle_bytes 8.634368e+06
# HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.
# TYPE go_memstats_heap_inuse_bytes gauge
go_memstats_heap_inuse_bytes 1.1190272e+07
# HELP go_memstats_heap_objects Number of allocated objects.
# TYPE go_memstats_heap_objects gauge
go_memstats_heap_objects 38430
# HELP go_memstats_heap_released_bytes Number of heap bytes released to OS.
# TYPE go_memstats_heap_released_bytes gauge
go_memstats_heap_released_bytes 5.758976e+06
# HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system.
# TYPE go_memstats_heap_sys_bytes gauge
go_memstats_heap_sys_bytes 1.982464e+07
# HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
# TYPE go_memstats_last_gc_time_seconds gauge
go_memstats_last_gc_time_seconds 1.7332894597458868e+09
# HELP go_memstats_lookups_total Total number of pointer lookups.
# TYPE go_memstats_lookups_total counter
go_memstats_lookups_total 0
# HELP go_memstats_mallocs_total Total number of mallocs.
# TYPE go_memstats_mallocs_total counter
go_memstats_mallocs_total 3.606699e+06
# HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache structures.
# TYPE go_memstats_mcache_inuse_bytes gauge
go_memstats_mcache_inuse_bytes 2400
# HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system.
# TYPE go_memstats_mcache_sys_bytes gauge
go_memstats_mcache_sys_bytes 15600
# HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan structures.
# TYPE go_memstats_mspan_inuse_bytes gauge
go_memstats_mspan_inuse_bytes 156960
# HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system.
# TYPE go_memstats_mspan_sys_bytes gauge
go_memstats_mspan_sys_bytes 212160
# HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage collection will take place.
# TYPE go_memstats_next_gc_bytes gauge
go_memstats_next_gc_bytes 1.488544e+07
# HELP go_memstats_other_sys_bytes Number of bytes used for other system allocations.
# TYPE go_memstats_other_sys_bytes gauge
go_memstats_other_sys_bytes 651750
# HELP go_memstats_stack_inuse_bytes Number of bytes in use by the stack allocator.
# TYPE go_memstats_stack_inuse_bytes gauge
go_memstats_stack_inuse_bytes 1.114112e+06
# HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator.
# TYPE go_memstats_stack_sys_bytes gauge
go_memstats_stack_sys_bytes 1.114112e+06
# HELP go_memstats_sys_bytes Number of bytes obtained from system.
# TYPE go_memstats_sys_bytes gauge
go_memstats_sys_bytes 2.7088136e+07
# HELP go_threads Number of OS threads created.
# TYPE go_threads gauge
go_threads 12
# HELP cluster_pg_data_disk_size_total The total size of the data disk of the cluster, unit: GiB.
# TYPE cluster_pg_data_disk_size_total gauge
cluster_pg_data_disk_size_total 15
# HELP cluster_pg_data_disk_size_used The used size of the data disk of the cluster, unit: GiB.
# TYPE cluster_pg_data_disk_size_used gauge
cluster_pg_data_disk_size_used 0.77
# HELP cluster_cpu_utilization The CPU utilization of the cluster, percentage.
# TYPE cluster_cpu_utilization gauge
cluster_cpu_utilization 0.39
# HELP cluster_memory_usage The memory usage of the cluster, unit: MiB.
# TYPE cluster_memory_usage gauge
cluster_memory_usage 108.34
```
</details>