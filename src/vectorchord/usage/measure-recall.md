# Measure Recall <badge type="tip" text="since v0.5.0" />

In the world of vector search, recall refers to the percentage of vectors that the index returns which are true nearest neighbors. For example, if a nearest neighbor query for the 200 nearest neighbors returns 194 of the ground truth nearest neighbors, then the recall is 194/200 x 100 = 97%.

In a vector query, recall is important because it measures the percentage of relevant results retrieved from a search. Recall helps you evaluate the quality of a vector index and provides insight into balancing search speed and accuracy.

With VectorChord, you can find the recall for a vector query on a vector index for any SQL query. You can easily tune the [search parameters](indexing#search-parameters) to achieve the desired search recall.

::: code-group

```sql [vchordrq]
-- You can tune the search parameters before measure
-- SET vchordrq.probes = '100'
-- SET vchordrq.epsilon = 1.0

SELECT vchordrq_evaluate_query_recall(query=>$$
  SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10
$$);
```

:::

::: details

By default, the function uses `exact_search=>false` to generate a **slightly inaccurate** ground truth by setting `vchordrq.probes` to an extremely large value (65535). This method is much faster than using `exact_search=true` for a full table scan, and the resulting precision is acceptable in most situations.

:::

## Reference

### Functions <badge type="info" text="vchordrq" />

#### `vchordrq_evaluate_query_recall`

- Description: Evaluates the recall of a given SQL query.
- Result: `real` (a value between 0.0 and 1.0, or NaN if no results are found)
- Arguments:
    - `query`(text): The SQL query to be evaluated.
    - `exact_search`(boolean): A flag to indicate whether an full table scan should be performed for the ground truth set. The default value is false.
    - `accu_probes`(text): Used when `exact_search` is false. It specifies the `vchordrq.probes` value for the ANN search that generates the estimated ground truth. If NULL, it will be derived from the active `vchordrq.probes` setting  during the initial query execution.
    - `accu_epsilon`(real): Used when `exact_search` is false. It specifies the `vchordrq.epsilon` value for the ANN search that generates the estimated ground truth. The default value is 1.9.
- Example:
    - `SELECT vchordrq_evaluate_query_recall(query=>$$SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10$$);`
    - `SELECT vchordrq_evaluate_query_recall(query=>$$SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10$$, exact_search=>true);`
    - `SELECT vchordrq_evaluate_query_recall(query=>$$SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10$$, exact_search=>false, accu_probes=>'100', accu_epsilon=>3.9);`
