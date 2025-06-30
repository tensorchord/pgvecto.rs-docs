# Index Prewarm

Like other PostgreSQL indexes, a vector index needs to be read from disk into memory (such as PostgreSQL's shared buffers or the operating system's file system cache) before it can be fully utilized.

This initial disk I/O happens when the index is accessed for the first time after the database server starts or if the relevant index data has been evicted from the cache. Consequently, the very first query that uses the index may experience significantly slower performance compared to subsequent queries where the index data is already cached in memory.

In VectorChord, we have index prewarm to improve first query performance. Let's dive in!

## How to start

The function `vchordrq_prewarm` improves the performance of initial queries by loading the following information into memory:
- Index metadata
- Centroid of each cluster
- Quantized vectors

You can call `vchordrq_prewarm` by passing the index name:

```SQL
-- vchordrq_prewarm(index_name) to prewarm the index into the shared buffer
SELECT vchordrq_prewarm('gist_train_embedding_idx')
```

:::tip
`vchordrq_prewarm` only prewarms the most frequently used data in the index, which is small enough to store in memory in most cases. In contrast, [`pg_prewarm`](https://www.postgresql.org/docs/current/pgprewarm.html) will prewarm the entire index, which is unacceptable for a table with millions of rows.
:::
