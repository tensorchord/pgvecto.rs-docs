# Upgrading

There are two general steps for upgrading:

* Upgrade schema.
* Reindex indexes.

## Upgrade schema

If you update the extension to a new version, let's say it's `999.999.999`. This command helps you to update the schema of extension:

```sql
ALTER EXTENSION vectors UPDATE TO '999.999.999';
```

If you're upgrading from `0.1.x`, please read [Upgrading from 0.1.x](#upgrade-from-01x).

## Reindex indexes

After an upgrade, you may need to do manual maintenance, or reindex all vector indexes or just do nothing.

You could check the status of all vector indexes in this command:

```sql
SELECT indexname, idx_status FROM pg_vector_index_stat;
```

* If you see all values in the `idx_status` column are `NORMAL`:

```
 indexname   | idx_status 
-------------+------------
 t_val_idx_1 | NORMAL
 t_val_idx_2 | NORMAL
```

You need to do nothing. Everything goes well.

* If you see some values in the `idx_status` column are `UPGRADE`:

```
 indexname   | idx_status 
-------------+------------
 t_val_idx_1 | NORMAL
 t_val_idx_2 | UPGRADE
```

You need to reindex vector indexes that needs upgrading.

```sql
REINDEX INDEX t_val_idx_2;
```

* If you see an error: `The extension is upgraded so all index files are outdated.`.

You need to delete the index files created by older versions. The files are in the `pg_vectors` folder under PostgreSQL data directory, or volume directory for Docker users.

```shell
rm -rf $(psql -U postgres -tAqX -c 'SHOW data_directory')/pg_vectors
```

Restart PostgreSQL and then get all vector indexes.

```sql
SELECT
        I.relname AS indexname
    FROM pg_index X JOIN
         pg_class I ON I.oid = X.indexrelid JOIN
         pg_am A ON A.oid = I.relam
    WHERE A.amname = 'vectors';
```

```
 indexname
-------------
 t_val_idx_1
 t_val_idx_2
```

Reindex all vector indexes.

```sql
REINDEX INDEX t_val_idx_1;
REINDEX INDEX t_val_idx_2;
```

## Upgrade from 0.1.x

You need to follow these steps to make `ALTER EXTENSION vectors UPDATE TO '0.2.0'` work.

Let's assume your `pgvecto.rs` version is `0.1.x` (replace `x` with a number).

```sql
UPDATE pg_catalog.pg_extension SET extversion = '0.1.x' where extname = 'vectors';
UPDATE pg_catalog.pg_extension SET extrelocatable = true where extname = 'vectors';
ALTER EXTENSION vectors SET SCHEMA vectors;
UPDATE pg_catalog.pg_extension SET extrelocatable = false where extname = 'vectors';
ALTER EXTENSION vectors UPDATE TO '0.2.0';
```

`pgvecto.rs` is installed in schema `vectors` from `0.2.0`, you may need to set `search_path` for the database.
