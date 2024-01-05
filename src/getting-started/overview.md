# Overview

An introduction to the pgvecto.rs.

## What is pgvecto.rs

pgvecto.rs is a Postgres extension that provides vector similarity search functions. It is written in Rust and based on [pgrx](https://github.com/tcdi/pgrx). It is currently in the beta status, we invite you to try it out in production and provide us with feedback. Read more at [📝our launch blog](https://modelz.ai/blog/pgvecto-rs).

## Why use pgvecto.rs

- 💃 **Easy to use**: pgvecto.rs is a Postgres extension, which means that you can use it directly within your existing database. This makes it easy to integrate into your existing workflows and applications.
- 🔗 **Async indexing**: pgvecto.rs's index is asynchronously constructed by the background threads and does not block insertions and always ready for new queries.
- 🥅 **Filtering**: pgvecto.rs supports filtering. You can set conditions when searching or retrieving points. This is the missing feature of other postgres extensions.
- 🧮 **Quantization**: pgvecto.rs supports scalar quantization and product qutization up to 64x.
- 🦀 **Rewrite in Rust**: Rust's strict compile-time checks ensure memory safety, reducing the risk of bugs and security issues commonly associated with C extensions.

## Comparison with pgvector

|                                             | pgvecto.rs                                             | pgvector                |
| ------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| Transaction support                         | ✅                                                      | ⚠️                       |
| Sufficient Result with Delete/Update/Filter | ✅                                                      | ⚠️                       |
| Vector Dimension Limit                      | 65535                                                  | 2000                    |
| Prefilter on HNSW                           | ✅                                                      | ❌                       |
| Parallel HNSW Index build                   | ⚡️ Linearly faster with more cores                      | 🐌 Only single core used |
| Async Index build                           | Ready for queries anytime and do not block insertions. | ❌                       |
| Quantization                                | Scalar/Product Quantization                            | ❌                       |

More details at [📝pgvecto.rs vs. pgvector](/faqs/comparison-pgvector.md).

## Quick start

For new users, we recommend using the [Docker image](https://hub.docker.com/r/tensorchord/pgvecto-rs) to get started quickly.

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.1.13
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```sh
psql -h localhost -p 5432 -U postgres
```

Run the following SQL to ensure the extension is enabled.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

pgvecto.rs introduces a new data type `vector(n)` denoting an n-dimensional vector. The `n` within the brackets signifies the dimensions of the vector.

You could create a table with the following SQL. 

```sql
-- create table with a vector column

CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding vector(3) NOT NULL -- 3 dimensions
);
```

::: details

`vector(n)` is a valid data type only if $1 \leq n \leq 65535$. Due to limits of PostgreSQL, it's possible to create a value of type `vector(3)` of $5$ dimensions and `vector` is also a valid data. However, you cannot still put $0$ scalar or more than $65535$ scalars to a vector. If you use `vector` for a column or there is some values mismatched with dimension denoted by the column, you won't able to create an index on it.

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
- `<=>`: negative cosine similarity, defined as $- \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

```sql
-- call the distance function through operators

-- squared Euclidean distance
SELECT '[1, 2, 3]'::vector <-> '[3, 2, 1]'::vector;
-- negative dot product
SELECT '[1, 2, 3]'::vector <#> '[3, 2, 1]'::vector;
-- negative cosine similarity
SELECT '[1, 2, 3]'::vector <=> '[3, 2, 1]'::vector;
```

You can search for a vector simply like this.

```sql
-- query the similar embeddings
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

### Half-precision floating-point

`vecf16` type is the same with `vector` in anything but the scalar type. It stores 16-bit floating point numbers. If you want to reduce the memory usage to get better performance, you can try to replace `vector` type with `vecf16` type.

## Roadmap 🗂️

Please check out [ROADMAP](../community/roadmap).

## Contribute 😊

We welcome all kinds of contributions from the open-source community, individuals, and partners.

- Join our [discord community](https://discord.gg/KqswhpVgdU)!
- To build from the source, please read our [contributing documentation](../community/contributing) and [development tutorial](../developers/development).

### Talk with us

💬 Interested in talking with us about your experience building or managing AI/ML applications?

[**Set up a time to chat!**](https://calendly.com/cegao/tensorchord-interview)
