# Rerank In Table

To maximize performance, VectorChord stores both the quantized and original vectors in the index.
Although the original vectors can be fetched from the table, doing so is much slower than fetching them from our highly optimized data structure.


As a result, VectorChord's disk usage could be larger than that of alternatives. This is usually acceptable because disk space is affordable and performance is more important.

This behavior is called `rerank_in_index` and is the default option for VectorChord.

---

However, if you are short on disk space and don't care much about performance, you can enable `rerank_in_table` in `CREATE INDEX` to reduce disk usage.


```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
rerank_in_table = true
[build.internal]
lists = []
$$);
```

Then, all queries of this index will retrieve the original vectors from the table, which will significantly reduce disk usage.

## Performance Trade-offs

- Compared to the `rerank_in_index` option, the `rerank_in_table` option will result in a **30-50%** increase in latency and QPS loss at query
- Compared to the `rerank_in_index` option, the `rerank_in_table` option index will save about **50%** of disk usage