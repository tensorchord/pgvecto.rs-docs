# Rerank In Table

To maximize performance, VectorChord stores both the quantized and original vectors in the index.
Although the original vectors can be fetched from the table, doing so is much slower than fetching them from our highly optimized data structure.

As a result, VectorChord's [superior performance](https://blog.vectorchord.ai/vector-search-over-postgresql-a-comparative-analysis-of-memory-and-disk-solutions) is partly due to its larger disk usage compared to disk-saving solutions like pgvectorscale. However, this is usually acceptable because disk space is affordable, and performance is more important.

This behavior is called `rerank in index` and is the default option for VectorChord.

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

- Query performance⛔️: With the `rerank_in_table` option, the `vchordrq` index will experience a 30-50% increase in query latency
- Index size✅: With `rerank_in_table` option, the `vchordrq` index  will save about **50%** of disk usage

::: warning
[Prefetch](./prefetch) does not work when `rerank_in_table` is enabled. Disk read operations, such as large indexes and cold starts, will be heavily affected.
:::
