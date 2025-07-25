# Similarity Filter

Usually, `ORDER BY` and `LIMIT` clauses are used to perform vector search. In some cases, you want to use the `WHERE` clause to avoid searching for vectors that are too far from the target vector. Naturally, you might write the following SQL.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <-> '[0, 0, 0]' < 0.1 ORDER BY embedding <-> '[0, 0, 0]' LIMIT 10;
                                  QUERY PLAN                                   
-------------------------------------------------------------------------------
 Limit
   ->  Index Scan using items_embedding_idx on items
         Order By: (embedding <-> '[0,0,0]'::vector)
         Filter: ((embedding <-> '[0,0,0]'::vector) < '0.1'::double precision)
```

The returned results meet expectations, but you will find the performance is poor. It's because if there are fewer than $10$ vectors within the distance threshold, PostgreSQL makes the index continue to search to get $10$ results, until the entire search space is exhausted.

To avoid this situation, you can use specific syntax to push the filter down to the vector index, allowing the index to stop searching immediately after the search range leaves the target area. In this document, this type of filter that can be pushed down to the index and describes the distance between vectors and the target vector is called a similarity filter.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <<->> sphere('[0, 0, 0]'::vector, 0.1) ORDER BY embedding <-> '[0, 0, 0]' LIMIT 10;
                               QUERY PLAN                               
------------------------------------------------------------------------
 Limit
   ->  Index Scan using items_embedding_idx on items
         Index Cond: (embedding <<->> '("[0,0,0]",0.1)'::sphere_vector)
         Order By: (embedding <-> '[0,0,0]'::vector)
```

`embedding <<->> sphere('[0, 0, 0]'::vector, 0.1)` evaluates to `true` if and only if the L2 distance between the two vectors is less than `0.1`. For negative inner product, the `<<#>>` operator should be used here. For cosine distance, the `<<=>>` operator should be used here.

Additionally, if you specify only the `WHERE` clause without an `ORDER BY`, the index still works properly.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <<->> sphere('[0, 0, 0]'::vector, 0.1);
                            QUERY PLAN                            
------------------------------------------------------------------
 Index Scan using items_embedding_idx on items
   Index Cond: (embedding <<->> '("[0,0,0]",0.1)'::sphere_vector)
```

:::warning
[Multi-Vector Retrieval](indexing-with-maxsim-operators) does not support similarity filter yet.
:::
