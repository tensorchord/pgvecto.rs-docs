# Overview

An introduction to the `pgvecto.rs`.

## What is `pgvecto.rs`

`pgvecto.rs` is a Postgres extension that provides vector similarity search functions. It is written in Rust and based on [pgrx](https://github.com/tcdi/pgrx). It is currently in the beta status, we invite you to try it out in production and provide us with feedback. Read more at [📝our launch blog](https://blog.pgvecto.rs/pgvectors-02-unifying-relational-queries-and-vector-search-in-postgresql).

## Why use `pgvecto.rs`

- 💃 **User-Friendly**: Effortlessly incorporate `pgvecto.rs` into your existing database as a Postgres extension, streamlining integration with your current workflows and applications.
- 🥅 **Join and Filter without Limitation**: Elevate your search capabilities in `pgvecto.rs` with VBASE filtering. Apply any filter conditions and join with other tables, achieving high recall and low latency, a distinctive edge over other vector databases.
- 🌓 **Efficient FP16 Support**: Optimize your data storage with `pgvecto.rs`, supporting FP16 vector type to cut memory and storage usage by half, and boosting throughput.
- 🧮 **Advanced Quantization**: Utilize scalar and product quantization in `pgvecto.rs` for up to 64x compression. Achieve up to 4x memory savings with less than 2% recall loss with scalar quantization.
- 🔍 **Hybrid Search**: Leverage the full-text search functionality in PostgreSQL with `pgvecto.rs` to search text and vector data within a single query.
- 🔗 **Async indexing**: The `pgvecto.rs` index is built asynchronously by background threads, allowing non-blocking inserts and always ready for new queries.
- ⬆️ **Extended Vector Length**: `pgvecto.rs` supports vector length up to 65535, suitable for the latest models.
- 🦀 **Rust-Powered Reliability**: Rust's strict compile-time checks ensure memory safety, reducing the risk of bugs and security issues commonly associated with C extensions.

## Quick start

For new users, we recommend using the [Docker image](https://hub.docker.com/r/tensorchord/pgvecto-rs) to get started quickly.

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.2.0
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

Run the following SQL to ensure the extension is enabled.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

`pgvecto.rs` introduces a new data type `vector(n)` denoting an n-dimensional vector. The `n` within the brackets signifies the dimensions of the vector.

You could create a table with the following SQL. 

```sql
-- create table with a vector column

CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding vector(3) NOT NULL -- 3 dimensions
);
```

::: details

`vector(n)` is a valid data type only if $1 \leq n \leq 65535$. Due to limits of PostgreSQL, it's possible to create a value of type `vector(3)` of $5$ dimensions and `vector` is also a valid data type. However, you cannot still put $0$ scalar or more than $65535$ scalars to a vector. If you use `vector` for a column or there is some values mismatched with dimension denoted by the column, you won't able to create an index on it.

:::

You can then populate the table with vector data as follows.

```sql
-- insert values

INSERT INTO items (embedding)
VALUES ('[1,2,3]'), ('[4,5,6]');

-- or insert values using a casting from array to vector

INSERT INTO items (embedding)
VALUES (ARRAY[1, 2, 3]::real[]), (ARRAY[4, 5, 6]::real[]);
```

We support three operators to calculate the distance between two vectors.

- `<->`: squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>`: negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>`: cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

```sql
-- call the distance function through operators

-- squared Euclidean distance
SELECT '[1, 2, 3]'::vector <-> '[3, 2, 1]'::vector;
-- negative dot product
SELECT '[1, 2, 3]'::vector <#> '[3, 2, 1]'::vector;
-- cosine distance
SELECT '[1, 2, 3]'::vector <=> '[3, 2, 1]'::vector;
```

You can search for a vector simply like this.

```sql
-- query the similar embeddings
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

### Half-precision floating-point

`vecf16` type is the same with `vector` in anything but the scalar type. It stores 16-bit floating point numbers. If you want to reduce the memory usage to get better performance, you can try to replace `vector` type with `vecf16` type.

For more usage of `vecf16`, please refer to [vector types](../usage/vector-types.html#vecf16-half-precision-vector).

### Sparse vector

`svector` type is a sparse vector type. It stores a vector in a sparse format. It is suitable for vectors with many zeros.

For more usage of `svector`, please refer to [vector types](../usage/vector-types.html#svector-sparse-vector).

### Binary vector

`bvector` type is a binary vector type. It is a fixed-length bit string. Except for above 3 distances, we also support `jaccard` distance `<~>`, which defined as $1 - \frac{|X\cap Y|}{|X\cup Y|}$. And `hamming` distance is the same with squared Euclidean distance, you can use `<->` operator to calculate it. We also provide `binarize` function to construct a `bvector` from a `vector`, which set the positive elements to 1, otherwise 0.

For more usage of `bvector`, please refer to [vector types](../usage/vector-types.html#bvector-binary-vector).

## Roadmap 🗂️

Please check out [ROADMAP](../community/roadmap).

## Contribute 😊

We welcome all kinds of contributions from the open-source community, individuals, and partners.

- Join our [discord community](https://discord.gg/KqswhpVgdU)!
- To build from the source, please read our [contributing documentation](../community/contributing) and [development tutorial](../developers/development).

### Talk with us

💬 Interested in talking with us about your experience building or managing AI/ML applications?

[**Set up a time to chat!**](https://calendly.com/cegao/tensorchord-interview)
