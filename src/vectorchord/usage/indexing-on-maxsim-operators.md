# Indexing on MaxSim Operators

Late interaction models embed documents and queries as vector arrays separately and compute similarity through an operator called `MaxSim`. The definition of the `MaxSim` operator is $\sum_i \max_j (- q_i \cdot d_j)$, meaning that for each vector in the query vector array, the closest vector in the document vector array is found, their dot product is calculated, and the results are summed.

In VectorChord, the symbol for this operator is `@#`. Left operand is the document vector array, and right operand is the query vector array.

Like other operators, queries that use the `MaxSim` operator can be accelerated through indexing.

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embeddings vector(3)[]);

CREATE INDEX ON items USING vchordrq (embeddings vector_maxsim_ops);
```

Then you can insert the rows, and perform queries with following SQL:

```sql
SET vchordrq.probes TO '';
SET vchordrq.max_maxsim_tuples TO 1000;
SELECT * FROM items ORDER BY embeddings @# ARRAY['[3,1,2]', '[2,2,2]']::vector[] LIMIT 5;
```

To make `MaxSim` indexes work, the GUC parameter `vchordrq.max_maxsim_tuples` must be configured. The `MaxSim` index performs multiple vector searches for each vector in the query vector array with a top-k value of `vchordrq.max_maxsim_tuples`, then merges these search results to obtain the final output.

If certain values are missing from the search results, the `MaxSim` index estimates the missing values using the maximum distance found in the retrieved results, thereby completing the search result set. The GUC parameter `vchordrq.maxsim_threshold` enables more aggressive missing value estimation. The index locates the first cluster at the lowest-level lists whose cumulative size meets or exceeds `vchordrq.maxsim_threshold`, using its distance to the query vector for missing value estimation. The default value of `vchordrq.maxsim_threshold` is `0`, meaning that more aggressive missing value estimation is not enabled.
