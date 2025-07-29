# Prewarm

After PostgreSQL starts, tables and indexes are loaded from storage into the buffer pool only when they are accessed for the first time. As queries are executed, the frequently accessed parts of the index are naturally cached in the buffer pool. However, as initial queries are executed, the buffer pool is empty, which causes the queries to be slow.

The PostgreSQL extension `pg_prewarm` includes the `pg_prewarm` function, which can partially address this issue. After PostgreSQL starts, you simply provide the name of the index to this function, and it will load the index from storage into the buffer pool.

```sql
SELECT pg_prewarm('items_pkey');
```

However, it only works if the size of the buffer pool is much larger than the size of the index. For vector indexes, the index size is often much larger than memory size. Vector indexes are designed so that the index data is divided into two parts: a small, hot portion and a large, cold portion. Vector indexes only need the hot portion in memory to achieve reasonable performance. Therefore, a specialized prewarm function exists and it loads only the hot portion of the index into memory.

```sql
SELECT vchordrq_prewarm('items_embedding_idx');
```

It works well even if the index size is much larger than memory size.

## Reference

### Functions <badge type="info" text="vchordrq" />

#### `vchordrq_prewarm`

- Description: This function warms the `vchordrq` index by loading index to buffer pool.
- Result: `text`
- Arguments:
    - `regclass`, an object identifier of the `vchordrq` index
- Example:
    - `SELECT vchordrq_prewarm('items_embedding_idx')`
