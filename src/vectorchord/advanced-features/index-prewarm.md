# Index Prewarm

Like other PostgreSQL indexes, a vector index needs to be read from disk or operating system page cache into PostgreSQL's buffer pool before it can be fully utilized.

This initial disk I/O happens when the index is accessed for the first time after the database server starts or if the relevant index data has been evicted from the cache. Consequently, the very first query that uses the index may experience significantly slower performance compared to subsequent queries where the index data is already in buffer pool.

In VectorChord, we have index prewarm to improve first query performance. Let's dive in!

## How to start

The function `vchordrq_prewarm` improves the performance of initial queries by loading hot data (mainly quantized vectors) into buffer pool.

You can call it by passing the index name:

```SQL
-- vchordrq_prewarm(index_name) to prewarm the hot data in index into buffer pool
SELECT vchordrq_prewarm('gist_train_embedding_idx')
```

:::tip
Unlike [`pg_prewarm`](https://www.postgresql.org/docs/current/pgprewarm.html), `vchordrq_prewarm` only loads the necessary hot data into memory. If your vector index is too large to fit entirely in memory (i.e., a disk-based index), `vchordrq_prewarm` is more suitable than `pg_prewarm`. On the other hand, if your index is small and your goal is to completely eliminate I/O latency, `pg_prewarm` is the better choice.
:::
