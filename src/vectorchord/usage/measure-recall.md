# Measure Recall <badge type="tip" text="since v0.5.0" />

In the context of vector search, recall is the ratio of true nearest neighbors to approximate nearest neighbors returned by the index. For example, if the index retrieves $100$ approximate nearest neighbors and $97$ of them are true nearest neighbors, then the recall is $\frac{97}{100} = 0.97$.

Recall measures the ratio of relevant results to all results retrieved from a search. When using an index, you likely want to know the recall and QPS corresponding to different parameters. The function `vchordrq_evaluate_query_recall` is designed for evaluating recall. It receives a query that returns row identifiers and returns the corresponding recall.

```sql
SET vchordrq.probes = '100';
SET vchordrq.epsilon = 1.0;
SELECT vchordrq_evaluate_query_recall(query => $$
  SELECT ctid FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10);
$$);
```

By default, the function evaluates the recall by generating estimated ground truth with another index scan. If you would like to evaluate the recall by generating ground truth with a table scan, set the function parameter `exact_search` to `true`.

```sql
SET vchordrq.probes = '100';
SET vchordrq.epsilon = 1.0;
SELECT vchordrq_evaluate_query_recall(query => $$
  SELECT ctid FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10
$$, exact_search => true);
```

## Reference

This feature is not supported by `vchordg`.

### Functions <badge type="info" text="vchordrq" />

#### `vchordrq_evaluate_query_recall` <badge type="tip" text="since v0.5.0" />

- Description: Evaluates the recall of a given `vchordrq` query.
- Result: `real`
- Arguments:
    - `query: text`, the query whose recall is evaluated
    - `exact_search: boolean`, use ground truth instead of estimated ground truth
    - `accu_probes: text`, `vchordrq.probes` for estimated ground truth
    - `accu_epsilon: real`, `vchordrq.epsilon` for estimated ground truth
- Example:
    - `SELECT vchordrq_evaluate_query_recall(query => $$ SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10 $$);`
    - `SELECT vchordrq_evaluate_query_recall(query => $$ SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10 $$, exact_search => true);`
    - `SELECT vchordrq_evaluate_query_recall(query => $$ SELECT ctid FROM t ORDER BY val <-> '[0.5, 0.25, 1.0]' LIMIT 10 $$, accu_probes => '9999', accu_epsilon => 4.0);`
