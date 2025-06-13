---
outline: [2,3]
---
# PGVecto.rs Migration Overview

## From pgvector

### Prerequisites

When migrating from `pgvector` to `PGVecto.rs`, it is possible that you may have a table with a column of vector type. An example of this would be:

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
```

In addition, some rows will be inserted into the table, as follows:

```sql
INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
```

In most cases, there will also be one or more vector indexes:

```sql
CREATE INDEX ON items USING hnsw (embedding vector_l2_ops);
```

This is a typical scenario when `pgvector` is used. If the following requirements are met, the migration can be initiated.

- Please note that your `pgvector` extension is not installed in the `vectors` schema. This means that you can install `pgvector` and `PGVecto.rs` at the same time.

### Steps to Migration

#### 1. Install PGVecto.rs

Please follow the [instructions](../getting-started/installation) provided to install `PGVecto.rs` and ensure that the extension is loaded by PostgreSQL.

```sql
CREATE EXTENSION vectors;
```

The two extensions, `pgvector` and `PGVecto.rs`, are now installed at the PostgreSQL.

To validate the install, please run `\dx` in psql. You will see that there is an extension called `vector` for `pgvector` and another called `vectors` for `PGVecto.rs`.

```shell
postgres=# \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description                                          
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vector  | 0.7.2   | public     | vector data type and ivfflat and hnsw access methods
 vectors | 0.3.0   | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
```

Please note that there are some symbols with the same name in both extensions. This may cause confusion when doing the migration. To differentiate between the two, please verify that the `search_path` does not include the `PGVecto.rs` schema `vectors`.

```sql
SHOW search_path;
-- if it shows: `"$user", public` -> This is okay
-- if it shows: `"$user", public, vectors` -> Remove `vectors` by:
SET search_path = "$user, public";
```

#### 2. Check exist indexes

For indexes created at vector columns, please retrieve the definition and record it in a convenient location. This information is necessary for the recovery of the indexes at a later stage.

```sql
postgres=# SELECT indexdef FROM pg_indexes WHERE tablename = 'items';
                                       indexdef                                        
---------------------------------------------------------------------------------------
 CREATE UNIQUE INDEX items_pkey ON public.items USING btree (id)
 CREATE INDEX items_embedding_idx ON public.items USING hnsw (embedding vector_l2_ops)
(2 rows)
```

#### 3. Migrate vector columns

To migrate from a pgvector vector column, the first step is to create a PGVecto.rs vector column of the corresponding type. The subsequent step is to replicate the vector data from the original column to the new one. 

Here provides the conversion path for each vector type of `pgvector`:

- `vector(pgvector) -> real[] -> vector(PGVecto.rs)`
- `halfvec -> vector(pgvector) -> real[] -> vector(PGVecto.rs) -> vecf16`
- `bit -> text[] -> real[] -> vector(PGVecto.rs) -> bvector`

This vector type is not supported for migration yet:
- `sparsevec`

**Method 1: Conversion after validation**

With this method, you can check the correctness of the vector data during the migration process, and you do not need to worry about the indexes that have been created on the vector columns, as they will be automatically deleted. 
However, it requires additional memory to store the vectors before and after the migration. 

::: warning
This step will cause some downtime, due to: 
- a short `ACCESS EXCLUSIVE` lock by `ALTER TABLE ADD COLUMN`
- a much longer `ROW EXCLUSIVE` lock by `UPDATE`
- a short `ACCESS EXCLUSIVE` lock by `ALTER TABLE DROP COLUMN`
:::

```sql
-- From vector type
ALTER TABLE items ADD COLUMN migrate_embedding vectors.vector(3);
UPDATE items SET migrate_embedding = embedding::real[]::vectors.vector;

-- From halfvec type
ALTER TABLE items ADD COLUMN migrate_embedding vectors.vecf16(3);
UPDATE items SET migrate_embedding = embedding::vector::real[]::vectors.vector::vectors.vecf16;

-- For bit type
ALTER TABLE items ADD COLUMN migrate_embedding vectors.bvector(3);
UPDATE items SET migrate_embedding = string_to_array(embedding::text, NULL)::real[]::vectors.vector::vectors.bvector;
```

Once the data has been copied, you can check the data by `SELECT` and replace the existing column with the new one.

```sql
ALTER TABLE items DROP COLUMN embedding;
ALTER TABLE items RENAME COLUMN migrate_embedding TO embedding;
```

**Method 2: Conversion without additional memory**

With this method, the migration will be completed in one command and no additional memory is required.
However, you need to delete the index on the vector column in advance.

::: warning
This step will cause some downtime, due to: 
- a long `ACCESS EXCLUSIVE` lock by `ALTER TABLE ALTER COLUMN`
:::

```sql
-- The name of index is from step 2
DROP INDEX IF EXISTS items_embedding_idx;

-- From vector type
ALTER TABLE items ALTER COLUMN embedding TYPE vectors.vector(3) USING embedding::real[]::vectors.vector;

-- From halfvec type
ALTER TABLE items ALTER COLUMN embedding TYPE vectors.vecf16(3) USING embedding::vector::real[]::vectors.vector::vectors.vecf16;

-- For bit type
ALTER TABLE items ALTER COLUMN embedding TYPE vectors.bvector(3) USING string_to_array(embedding::text, NULL)::real[]::vectors.vector::vectors.bvector;
```

#### 4. Recreate index

To recreate index on `vector` columns for `PGVecto.rs` , please enable the [compatibility mode](../usage/compatibility) and create it like before.

```sql
SET vectors.pgvector_compatibility=on;
-- Execute the command you get in step 2
CREATE INDEX items_embedding_idx ON public.items USING hnsw (embedding vector_l2_ops);
```

For other vector types, such as `halfvec`, `sparsevec`, and `bit`, please refer to the [indexing](../usage/indexing). Currently, `pgvector_compatibility` mode is not supported for these types.



#### 5. Clean the environment

You may now safely remove the `pgvector` extension if it is no longer required.

```
DROP extension vector;
```

In the event that the `pgvector` extension is removed, it is advisable to reset the `search_path` in order to ensure that symbols in `PGVecto.rs` are accessible globally.

```sql
SET search_path = "$user, public, vectors";
-- or globally
ALTER SYSTEM SET search_path = "$user, public, vectors";
```

### Verify the result

Once the migration task is executed, you can verify the new columns by `SELECT` SQL.

```sql
SELECT embedding, pg_typeof("embedding") from items limit 3;

-- embedding |   pg_typeof    
-------------+----------------
-- [1, 2, 3] | vectors.vector
-- [4, 5, 6] | vectors.vector
```