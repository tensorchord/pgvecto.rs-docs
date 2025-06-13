# Cold Start Optimization

The RaBitQ (vchordrq) index is loaded from the disk during the first query. This is why the cold start is much slower.

If the shared buffer is sufficient, the index can be cached in memory, which speeds up subsequent queries.

In VectorChord, we have indexing prewarm to improve cold start performance. Let's dive in!

## Indexing Prewarm

To improve performance for the first query, you can try the following SQL that preloads the index into memory.

```SQL
-- vchordrq_prewarm(index_name) to prewarm the index into the shared buffer
SELECT vchordrq_prewarm('gist_train_embedding_idx')
```

:::info
The runtime of `vchordrq_prewarm` is correlated to the number of rows, and can consume several minutes for large table (> $10^7$ rows).
:::

---

::: tip
Prefetch can also speed up cold start performance.
See also: [Prefetch Mode](../advanced-features/prefetch#prefetch-mode)
:::

