# Measure Recall

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

You may find it more useful to evaluate user-generated queries than randomly generated ones. VectorChord includes a built-in method to sample and store recent user queries. These records are grouped by index, making them easily accessible and seamlessly integrable with recall evaluation.

```sql
-- Enable the query sampling
ALTER SYSTEM SET vchordrq.query_sampling_enable = on;

-- Set the maximum number of queries to record per index
ALTER SYSTEM SET vchordrq.query_sampling_max_records = 1000;

-- Set the sampling rate (e.g., 1.0 for all queries, 0.01 for 1%)
-- For high-traffic systems, a rate of 0.01 or lower is recommended.
ALTER SYSTEM SET vchordrq.query_sampling_rate = 1;
SELECT pg_reload_conf();

-- Now, execute an example vector search
-- SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

After queries have been executed and sampled, you can inspect the captured components of them, including the schema, index, table, column, operator, and vector.

```sql
-- List recorded queries for a specific index
SELECT * from vchordrq_sampled_queries('idx');
-- schema_name | index_name | table_name | column_name | operator |    value
---------------+------------+------------+-------------+----------+--------------
-- public      | idx        | items      | embedding   | <->      | [0.5,0.25,1]

-- List recorded queries for all accessible indexes
-- DANGER: The result may unexpectedly mix records from multiple indexes. Please check carefully before use. // [!code error]
-- SELECT COUNT(DISTINCT index_name) FROM vchordrq_sampled_queries WHERE ... // [!code error]
SELECT * from vchordrq_sampled_queries;
```

To measure the recall of the recorded queries, you can reconstruct the target query statement. The `vchordrq_sampled_queries` view is **not** recommended here because the evaluated recall will be incorrect if the records come from more than one index.

```sql
SELECT AVG(recall_value) FROM (
    SELECT vchordrq_evaluate_query_recall(
            format(
                'SELECT ctid FROM %I.%I ORDER BY %I %s %s LIMIT 10',
                quote_ident(lq.schema_name),
                quote_ident(lq.table_name),
                quote_ident(lq.column_name),
                lq.operator,
                quote_literal(lq.value)
            )
    ) AS recall_value
    FROM vchordrq_sampled_queries('items_embedding_idx') AS lq
) AS eval_results;
```

::: tip IMPORTANT
- This feature adds an extra 0.3 to 1 millisecond of latency to SELECT statements, which can be reduced by lowering the value of `vchordrq.query_sampling_max_records`.
- Query records are not synchronized by replication or backup. Each Postgres replica maintains its own set of records based on the queries it processes.
:::

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

- Description: Controls the fraction of vchordrq index scan queries that will be recorded like [log_statement_sample_rate](https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOG-STATEMENT-SAMPLE-RATE). This setting is only active when `vchordrq.query_sampling_enable` is on.
- Type: real
- Default: `0`
- Domain: `[0, 1]`
- Example:
    - `vchordrq.query_sampling_rate = 0` records no query.
    - `vchordrq.query_sampling_rate = 0.01` records approximately 1% of queries.
    - `vchordrq.query_sampling_rate = 1` records every query.

### Functions <badge type="info" text="vchordrq" />

#### `vchordrq_sampled_queries` <badge type="tip" text="since v0.5.2" /> {#vchordrq-sampled-queries-func}

- Description: Retrieves the set of recorded queries for a **single**, **specified** vchordrq index.
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
    - `SELECT vchordrq_sampled_queries('idx');`

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