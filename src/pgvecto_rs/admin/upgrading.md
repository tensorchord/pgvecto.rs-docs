# Upgrading

## General Steps

If you update the extension to a new version, let's say it's `a.b.c`. This command helps you to update the schema of extension:

```sql
ALTER EXTENSION vectors UPDATE;
-- or
ALTER EXTENSION vectors UPDATE TO 'a.b.c';
```

If you're upgrading from `0.1.x`, please read [Upgrading from 0.1.x](#upgrade-from-0-1-x).

If you're upgrading to `0.4.0`, please read [Upgrading to 0.4.0](#upgrade-to-0-4-0).

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

## Upgrade to 0.4.0 {#upgrade-to-0-4-0}

You may get this error if some [indexes](../usage/indexing.md) were created before upgrading `pgvecto.rs` to 0.4.0:

```
ERROR:  index public.this_is_index depends on operator class vector_cos_ops for access method vectors
index public.this_is_index depends on operator class vector_cos_ops for access method vectorscannot drop operator class vector_cos_ops for access method vectors because other objects depend on it 

ERROR:  cannot drop operator class vector_cos_ops for access method vectors because other objects depend on it
SQL state: 2BP01
Detail: index public.that_is_also_index depends on operator class vector_cos_ops for access method vectors
index public.that_is_also_index depends on operator class vector_cos_ops for access method vectors
Hint: Use DROP ... CASCADE to drop the dependent objects too.
```

You can simply drop these indexes, and then upgrade the extension:

```sql
DROP INDEX this_is_index;
DROP INDEX that_is_also_index;

ALTER EXTENSION vectors UPDATE;

-- CREATE INDEX this_is_index ...
-- CREATE INDEX that_is_also_index ...
```

## Upgrade from 0.1.x {#upgrade-from-0-1-x}

You need to follow these steps to make `ALTER EXTENSION vectors UPDATE` work.

Let's assume your `pgvecto.rs` version is `0.1.x` (replace `x` with a number).

```sql
CREATE SCHEMA IF NOT EXISTS vectors;
UPDATE pg_catalog.pg_extension SET extversion = '0.1.x' where extname = 'vectors';
UPDATE pg_catalog.pg_extension SET extrelocatable = true where extname = 'vectors';
ALTER EXTENSION vectors SET SCHEMA vectors;
UPDATE pg_catalog.pg_extension SET extrelocatable = false where extname = 'vectors';
ALTER EXTENSION vectors UPDATE;
```

::: tip
`pgvecto.rs` is installed in schema `vectors` from `0.2.0`, you may need to set `search_path` for the database.
:::