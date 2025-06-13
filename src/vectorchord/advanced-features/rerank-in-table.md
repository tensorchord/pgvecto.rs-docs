# Rerank In Table <badge type="tip" text="since v0.2.1" />

Like most indexes, VectorChord stores vectors in both the index and the table.
Although vectors can also be fetched from the table, doing so is much slower than the default behavior.

Some disk-saving solutions, such as pgvectorscale, don't store vectors in the index to reduce storage. This may [negatively affect](https://blog.vectorchord.ai/vector-search-over-postgresql-a-comparative-analysis-of-memory-and-disk-solutions) query performance.

---

However, if you are short on disk space and don't care much about performance, you can enable `rerank_in_table` option in `CREATE INDEX` to reduce disk usage.


```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
rerank_in_table = true
[build.internal]
lists = []
$$);
```

Then, all queries of this index will retrieve the original vectors from the table, with a much smaller index size.

## Performance Trade-offs

- Query performance⛔️: With the `rerank_in_table` option, the `vchordrq` index will experience a significant (about 30%-50%) increase in query latency
- Index size✅: With `rerank_in_table` option, the `vchordrq` index  will save about 50% of disk usage

::: warning
[Prefetch](./prefetch) does not work when `rerank_in_table` is enabled.
:::
