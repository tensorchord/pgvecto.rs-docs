# Measure Recall <badge type="tip" text="since v0.5.0" />

In the context of vector search, recall is the ratio of true nearest neighbors to approximate nearest neighbors returned by the index. For example, if the index retrieves $100$ approximate nearest neighbors and $97$ of them are true nearest neighbors, then the recall is $\frac{97}{100} = 0.97$.

::: tip
This feature is in preview.
:::

## Recall Evaluation <badge type="tip" text="since v0.5.0" />

Recall measures the ratio of relevant results to all results retrieved from a search. When using an index, you likely want to know the recall and QPS corresponding to different parameters. The function `vchordrq_evaluate_query_recall` is designed for evaluating recall. It receives a query that returns row identifiers and returns the corresponding recall.

The `vchordrq_evaluate_query_recall` function internally relies on [`ctid`](https://www.postgresql.org/docs/current/ddl-system-columns.html#DDL-SYSTEM-COLUMNS-CTID) to compare the query results with the ground truth. Therefore, the `query` argument must start with `SELECT ctid`.

```sql
SET vchordrq.probes = '100';
SET vchordrq.epsilon = 1.0;
SELECT vchordrq_evaluate_query_recall(query => $$
  SELECT ctid FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10
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

## Query sampling <badge type="tip" text="since v0.5.2" />

To evaluate query recall, VectorChord includes a built-in method to sample queries.

```sql
SET vchordrq.query_sampling_enable = on;
SET vchordrq.query_sampling_max_records = 1000;
SET vchordrq.query_sampling_rate = 1;
```

Suppose you have executed an example vector search `SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10`.

After queries have been executed and sampled, you can inspect the captured components of them, including the schema, index, table, column, operator, and vector.

```sql
SELECT * from vchordrq_sampled_queries('items_embedding_idx');
-- schema_name | index_name          | table_name | column_name | operator |    value
---------------+---------------------+------------+-------------+----------+--------------
-- public      | items_embedding_idx | items      | embedding   | <->      | [0.5,0.25,1]
```

To measure the recall of the recorded queries, you can construct the target query statement.

```sql
SELECT AVG(recall_value) FROM (
    SELECT vchordrq_evaluate_query_recall(
            format(
                'SELECT ctid FROM %I.%I ORDER BY %I OPERATOR(%s) %L LIMIT 10',
                lq.schema_name,
                lq.table_name,
                lq.column_name,
                lq.operator,
                lq.value
            )
    ) AS recall_value
    FROM vchordrq_sampled_queries('items_embedding_idx') AS lq
) AS eval_results;
```

If you are using the [replication](https://www.postgresql.org/docs/current/runtime-config-replication.html) feature with a primary server and standby servers, please note that sampled queries are not synchronized by replication or backup. Rather, each server maintains its own set of queries based on those it processes.

## Reference

This feature is not supported by `vchordg` and Multi-Vector Retrieval.

### Search Parameters <badge type="info" text="vchordrq" /> {#search-parameters}

#### `vchordrq.query_sampling_enable` <badge type="tip" text="since v0.5.2" />

- Description: Enables or disables the query sampling of `vchordrq` index scan.
- Type: boolean
- Default: `off`

#### `vchordrq.query_sampling_max_records` <badge type="tip" text="since v0.5.2" />

- Description: Controls the maximum number of queries recorded per index. This setting is only active when `vchordrq.query_sampling_enable` is on.
- Type: integer
- Default: `0`
- Domain: `[0, 10000]`
- Example:
    - `vchordrq.query_sampling_max_records = 0` will maintain 0 queries for each index.
    - `vchordrq.query_sampling_max_records = 1000` will maintain up to the 1000 most recent queries for each index.

#### `vchordrq.query_sampling_rate` <badge type="tip" text="since v0.5.2" />

- Description: Controls the sampling rate at which queries are recorded. This setting is only active when `vchordrq.query_sampling_enable` is on.
- Type: real
- Default: `0`
- Domain: `[0, 1]`
- Example:
    - `vchordrq.query_sampling_rate = 0` records no query.
    - `vchordrq.query_sampling_rate = 0.01` records approximately 1% of queries.
    - `vchordrq.query_sampling_rate = 1` records every query. It's for testing purposes.

### Functions <badge type="info" text="vchordrq" />

#### `vchordrq_sampled_queries` <badge type="tip" text="since v0.5.2" /> {#vchordrq-sampled-queries-func}

- Description: Retrieves the set of recorded queries for a `vchordrq` index.
- Result: `table`
    - `schema_name: text`, the schema of the table in the query
    - `index_name: text`, the name of the index used in the query
    - `table_name: text`, the name of the table in the query
    - `column_name: text`, the column involved in the index scan
    - `operator: text`, the distance [operator](/vectorchord/usage/indexing#operator-classes) used in the query.
    - `value: text`, the text representation of the target vector from the query
- Arguments:
    - `regclass`, the object identifier of a `vchordrq` index
- Example:
    - `SELECT vchordrq_sampled_queries('items_embedding_idx');`

#### `vchordrq_sampled_values` <badge type="tip" text="since v0.5.2" />

- Description: Retrieves the target vector of recorded queries for a `vchordrq` index.
- Result: `text`, the text representation of the target vector from the query.
- Arguments:
    - `regclass`, the object identifier of a `vchordrq` index
- Example:
    - `SELECT vchordrq_sampled_values('items_embedding_idx');`
- Note: this view is only intended for debug.

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

### Views <badge type="info" text="vchordrq" />

#### `vchordrq_sampled_queries` <badge type="tip" text="since v0.5.2" />

- Description: Retrieves the set of recorded queries for **all** vchordrq indexes.
- Example:
    - `SELECT * from vchordrq_sampled_queries;`
- Note: this view is only intended for debug.