# Prefilter <badge type="tip" text="since v0.4.0" />

In a filtered index scan, the index performs the scan first and then PostgreSQL checks whether the filter conditions are satisfied. On this page, "filter" refers to the filter on the index scan node of the query plan in PostgreSQL. This is usually constructed from the `WHERE` clause in the SQL statement. The filter does not need to have a specific form.

```sql
EXPLAIN (COSTS FALSE)
SELECT * FROM items WHERE id <= 5000 AND vector_norm(embedding) < 0.5;
                          QUERY PLAN                          
--------------------------------------------------------------
 Index Scan using items_pkey on items
   Index Cond: (id <= 5000)
   Filter: (vector_norm(embedding) < '0.5'::double precision)
```

However, this is not always the most efficient approach for vector search. Consider the following query.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE id % 97 = 0 ORDER BY embedding <-> '[0, 0, 0]' LIMIT 10;
                     QUERY PLAN                      
-----------------------------------------------------
 Limit
   ->  Index Scan using items_embedding_idx on items
         Order By: (embedding <-> '[0,0,0]'::vector)
         Filter: ((id % '97'::bigint) = 0)
```

To retrieve $10$ vectors that satisfy the filter condition, the index returned approximately $970$ rows. This suggests that the index executed a large amount of redundant computation. If the index could leverage the filter condition for pruning, the computation would be significantly reduced. The vector index provides a GUC parameter `vchordrq.prefilter` that allows pruning of the search space based on the filter condition.

```sql
SET vchordrq.prefilter = on;
```

Prefilter enables the vector index to perform the search based on the filter. This prunes the search space, and a smaller search space leads to a more efficient search. However, checking whether the filter conditions are satisfied also introduces overhead. So prefilter is only recommended when the filter is strict (eliminating many rows) and cheap (computational cost is much lower than computing vector distances). To aid understanding, we present two incorrect usage examples:

* `id % 97 > 0`: this filter is relaxed
* `email ~ '^([a-zA-Z]+)*$'`: this filter is expensive

Based on our experimental results, the QPS speedup at different selectivity is as follows:

- 200% speedup at 1% selectivity
- 5% speedup at 10% selectivity

<img src="../images/prefilter.png" alt="Prefilter on LAION-5m" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

## Reference

### Search Parameters <badge type="info" text="vchordrq" />

#### `vchordrq.prefilter` <badge type="tip" text="since v0.4.0" />

- Description: The `vchordrq.prefilter` GUC parameter enables condition evaluation before distance computation. For example, in the query `SELECT * FROM items WHERE id % 2 = 0 ORDER BY embedding <-> '[3,1,2]' LIMIT 5`, the index normally computes all useful `embedding <-> '[3,1,2]'` distances first and then pass the rows to PostgreSQL, which filters out rows where `id % 2 != 0`. This parameter allows the index to pre-evaluate the condition and discard non-matching rows before computing their distances, improving query efficiency.
- Type: boolean
- Default: `false`
