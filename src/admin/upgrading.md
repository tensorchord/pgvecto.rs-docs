# Upgrading

## General Steps

If you update the extension to a new version, let's say it's `999.999.999`. This command helps you to update the schema of extension:

```sql
ALTER EXTENSION vectors UPDATE TO '999.999.999';
```

If you're upgrading from `0.1.x`, please read [Upgrading from 0.1.x](#upgrade-from-01x).

Execute the following SQL. It helps you do some maintenance work.

```sql
SELECT pgvectors_upgrade();
```

You need to restart PostgreSQL to take effects.

You could check the status of all vector indexes in this command:

```sql
SELECT
        I.relname AS indexname
    FROM pg_index X JOIN
         pg_class I ON I.oid = X.indexrelid JOIN
         pg_am A ON A.oid = I.relam
    WHERE A.amname = 'vectors';
```

Let's assume the output is:

```text
 indexname
-------------
 t_val_idx_1
 t_val_idx_2
```

Then you could reindex all vector indexes.

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
CREATE SCHEMA vectors;
ALTER EXTENSION vectors SET SCHEMA vectors;
UPDATE pg_catalog.pg_extension SET extrelocatable = false where extname = 'vectors';
ALTER EXTENSION vectors UPDATE TO '0.2.0';
```

`pgvecto.rs` is installed in schema `vectors` from `0.2.0`, you may need to set `search_path` for the database.
