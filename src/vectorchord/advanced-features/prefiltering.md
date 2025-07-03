# Prefiltering <badge type="tip" text="since v0.4.0" />

By default, in a filtered vector search, VectorChord will explore the entire vector space and apply filters based on the returned results. This approach may not be efficient enough in some cases.

The **prefiltering** strategy applies an additional filter before the vector search. This prunes the search space, thereby increasing the speed of the search. However, the additional filter also introduces an extra filter cost that should be considered.

Only a filter on `Index Scan` can benefit from prefiltering:

```sql
EXPLAIN (COSTS FALSE, TIMING FALSE) 
SELECT val FROM t WHERE tag > 1 ORDER BY val <-> '[0, 0, 0]';
               QUERY PLAN                
-----------------------------------------
 Index Scan using t_val_idx on t
   Order By: (val <-> '[0,0,0]'::vector)
   Filter: (tag > 1)
```

## Configuration

You can control the filtering strategy using the `vchordrq.prefilter` setting:

```sql
-- Enable prefiltering (default: off)
SET vchordrq.prefilter = on;
```

## Performance Trade-offs

Use prefiltering when:
- Your filtering conditions are highly selective (eliminate many rows)

Don't use prefiltering when:
- Your filtering conditions are less selective
- The filter is a costly operation, such as a `LIKE` filter with a complicated regular expression.

| Example                   | All rows | Selected rows | Selected rows / All rows |
| ------------------------- | -------- | ------------- | ------------------------ |
| A low selective filter    | 1000     | 900           | 90%                      |
| A medium selective filter | 1000     | 100           | 10%                      |
| A highly selective filter | 1000     | 10            | 1%                       |

---

Based on our experimental results, the QPS speedup at different value of `selected rows / all rows` is as follows:
- 200% speedup at 1%
- Not significant (5%) speedup at 10%

<img src="../images/prefilter.png" alt="Prefiltering on LAION-5m" style="width: 100%; height: auto; margin: 0 auto; display: block;" />