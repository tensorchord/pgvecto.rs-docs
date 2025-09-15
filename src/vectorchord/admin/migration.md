---
outline: [2,3]
---
# VectorChord Migration Overview

## From PGVecto.rs

Most of VectorChord's vector types are supported by `pgvector`.
Therefore, migrating from PGVecto.rs to VectorChord is a simple inversion of [migrating from pgvector to PGVecto.rs](/admin/migration).

:::tip
We provide migration image [modelzai/pgvectors-vchord](https://hub.docker.com/r/modelzai/pgvectors-vchord/tags) for pgvecto.rs to VectorChord and vice versa.
:::

### Prerequisites

Let's suppose that you have a table with vector data, and the extension `PGVecto.rs` installed. A simple example would be:

```sql
CREATE TABLE table_vector (id bigserial PRIMARY KEY, vec_f32 vectors.vector(3));
CREATE TABLE table_float16 (id bigserial PRIMARY KEY, vec_f16 vectors.vecf16(3));
CREATE TABLE table_binary (id bigserial PRIMARY KEY, vec_bits vectors.bvector(3));

```

In addition, some rows will be inserted into the table, as follows:

```sql
INSERT INTO table_vector (vec_f32) VALUES ('[0.1, 0.1, 0.1]'), ('[0.2, 0.2, 0.2]');
INSERT INTO table_float16 (vec_f16) VALUES ('[0.1, 0.1, 0.1]'), ('[-0.2, 0.2, 0.2]');
INSERT INTO table_binary (vec_bits) VALUES ('[0, 0, 0]'), ('[0, 0, 1]');
```

In most cases, there will also be one or more vector indexes:

```sql
CREATE INDEX index_vector ON table_vector USING vectors (vec_f32 vectors.vector_l2_ops) WITH (options = "[indexing.hnsw]");
-- CREATE INDEX index_float16 ON table_float16 USING vectors (vec_f16 vectors.vecf16_cos_ops) WITH (options = "[indexing.hnsw]");
-- CREATE INDEX index_binary ON table_binary USING vectors (vec_bits vectors.bvector_hamming_ops) WITH (options = "[indexing.hnsw]");
```

This is a typical scenario when `PGVecto.rs` is used. If the following requirements are met, the migration can be initiated.

- Please note that your `pgvector` and `VectorChord` extension is not installed in the `vectors` schema. This means that you can install `pgvector` and `PGVecto.rs` at the same time.

### Steps to Migration

#### 1. Install VectorChord

Please follow the [instructions](../getting-started/installation) provided to install `VectorChord` and ensure that the extension is loaded by PostgreSQL.

```sql
CREATE EXTENSION vchord CASCADE;
```

::: info

This will install vectorchord and pgvector at public schema, if other schema is picked, please subsititue `public` with your schema at the migration command.

:::

::: details

The two extensions `VectorChord` and `PGVecto.rs` are now installed on PostgreSQL, but inside different schemas.
To validate it, please run `\dx` in psql. You will see that there are 3 extensions:
- `vectors` for `PGVecto.rs` at schema vectors
- `vector` for `pgvector` at schema public
- `vchord` for `VectorChord` at schema public

```shell
postgres=# \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description                                          
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vchord  | 0.1.0   | public     | vchord: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
 vector  | 0.8.0   | public     | vector data type and ivfflat and hnsw access methods
 vectors | 0.5.2   | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
```

:::

#### 2. Check exist indexes

For indexes created at vector columns, please retrieve the definition and record it in a convenient location.
This information is necessary for the recovery of the indexes at a later stage.

```sql
postgres=# \di
                       List of relations
 Schema |        Name        | Type  |  Owner   |     Table     
--------+--------------------+-------+----------+---------------
 public | index_float16      | index | postgres | table_float16
 public | index_vector       | index | postgres | table_vector
 public | table_binary_pkey  | index | postgres | table_binary
 public | table_float16_pkey | index | postgres | table_float16
 public | table_vector_pkey  | index | postgres | table_vector
```

#### 3. Migrate vector columns

To migrate from a `PGVecto.rs` vector column, the first step is to cast column datatypes between extensions.

Here provides the conversion path for each vector type of `VectorChord`:

- `vector(PGVecto.rs) -> real[] -> vector(pgvector)`
- `vecf16 -> vector(PGVecto.rs) -> real[] -> halfvec`
- `bvector -> vector(PGVecto.rs) -> text[] -> real[] -> bit`
- `svector -> text -> index++ -> text -> sparsevec`

For sparse vector type `svector`, we need additional helper function to finish the casting, see the [appendix](#appendix-about-cast-of-sparse-vector).

The migration will be completed in one command and no additional memory is required.
However, you need to delete the index on the vector column in advance.

::: warning
This step will cause some downtime, due to:
- a long `ACCESS EXCLUSIVE` lock by `ALTER TABLE ALTER COLUMN`
:::

```sql
-- The name of index can be found in step 2
DROP INDEX IF EXISTS index_vector;

-- From vector type
ALTER TABLE table_vector ALTER COLUMN vec_f32 TYPE public.vector(3) USING vec_f32::real[]::public.vector;

-- From halfvec type
ALTER TABLE table_float16 ALTER COLUMN vec_f16 TYPE public.halfvec(3) USING vec_f16::vectors.vector::real[]::public.halfvec;

-- For bit type
ALTER TABLE table_binary ALTER COLUMN vec_bits TYPE bit(3) USING array_to_string(vec_bits::vectors.vector::real[], '')::bit(3);
```

#### 4. Recreate index

The next step is to recreate index on `vector` columns for `PGVecto.rs`.

```sql
CREATE INDEX ON index_vector USING vchordrq (vec_f32 vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [4096]
spherical_centroids = false
$$);
```

For more information of create index at `VectorChord`, see [indexing](../usage/indexing).

#### 5. Clean the environment

You may now safely remove the `PGVecto.rs` extension if it is no longer required.

```
DROP extension vectors;
```

### Appendix: cast of sparse vector {#appendix-about-cast-of-sparse-vector}

We have discussed most types, but not the sparse vector. It is a little more complicated than other types. Suppose we have a table with a sparse vector column:

```sql
CREATE TABLE table_sparse (id bigserial PRIMARY KEY, vec_sparse vectors.svector(3));
INSERT INTO table_sparse (vec_sparse) VALUES ('{0:-0.1, 1:0.1, 2:0.1}/3'), ('{0:-0.4, 1:-0.4, 2:-0.4}/3');
```

Sparse vectors have a different text representation between `PGVecto.rs` and `pgvector`: The index starts from 0 in `PGVecto.rs` and from 1 in `pgvector`.

For example, a typical sparse vector `[-1, 0, 1, 0, 2]` has a text representation of:
- `{0:-1, 2:1, 4:2}/5` in `PGVecto.rs`
- `{1:-1, 3:1, 5:2}/5` in `pgvector`

So we need a helper function to handle this change by processing the string:
```sql
CREATE OR REPLACE FUNCTION migrate_sparse(input_text text) RETURNS text AS $$
DECLARE
    output_text text := '';
    cache_index_number text := '';
    number_started boolean := false;
BEGIN
    FOR i IN 1..length(input_text) LOOP
        IF substring(input_text from i for 1) = ':' THEN
            output_text := output_text || (cache_index_number::int + 1)::text || ':';
            number_started := false;
        ELSIF substring(input_text from i for 1) ~ '[,{]' THEN
            cache_index_number := '';
            number_started := true;
            output_text := output_text || substring(input_text from i for 1);
        ELSIF substring(input_text from i for 1) ~ '[0-9]' THEN
            IF number_started THEN
                cache_index_number := cache_index_number || substring(input_text from i for 1);
            ELSE
                output_text := output_text || substring(input_text from i for 1);
            END IF;
        ELSE
            output_text := output_text || substring(input_text from i for 1);
        END IF;
    END LOOP;
    RETURN output_text;
END;
$$ LANGUAGE plpgsql;
```

After that, the migration can continue smoothly:
```sql
ALTER TABLE table_sparse ALTER COLUMN vec_sparse TYPE public.sparsevec USING migrate_sparse(vec_sparse::text)::public.sparsevec;
```
