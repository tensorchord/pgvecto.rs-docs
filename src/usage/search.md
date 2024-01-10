# Search

The SQL for searching is very simple. Here is an example of searching the $5$ nearest embedding in table `items`:

```sql
SET vectors.hnsw_ef_search = 64;
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

The vector index will search for `64` nearest rows, and `5` nearest rows is gotten since there is a `LIMIT` clause.

## Search modes

There are two search modes: `basic` and `vbase`.

### `basic`

`basic` is the default search mode. In this mode, vector indexes behave like a vector search library. It works well if all of your queries is like this:

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

It's recommended if your do **not** take advantages of

* database transaction
* deletions without `VACUUM`
* WHERE clauses and very complex SQL statments

### `vbase`

`vbase` is another search mode. In this mode, vector indexes behave like a database index.

Assuming you are using HNSW algorithm, you may want the following SQL to work:

```sql
SET vectors.hnsw_ef_search = 64;
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' WHERE id % 2 = 0 LIMIT 64;
```

In `basic` mode, you may only get `32` rows because the HNSW algorithm does search simply so the filter condition is ignored.

In `vbase` mode, the HNSW algorithm is guaranteed to return rows as many as you need, so you can always get correct behavior if your do take advantages of:

* database transaction
* deletions without `VACUUM`
* `WHERE` clauses and very complex SQL statments

You can enable `vbase` by a SQL statment `SET vectors.search_mode = vbase;`.

## Prefilter

If your queries include a `WHERE` clause, you can set set search mode to `vbase`. It's good and it even works on all conditions. `vbase` is a **postfilter** method: it pulls rows as many as you need, but it scans rows that you may not need. Since some rows will definitely be removed by the `WHERE` clause, we can skip scanning them, which will make the search faster. We call it **prefilter**.

Prefilter speeds your query in the following condition:

* You create a multicolumn vector index containing a vector column and many payload columns.
* The `WHERE` clause in a query is just simple like `(id % 2 = 0) AND (age >  50)`.

Prefilter is also used in internal implementation for handling deleted rows in pgvecto.rs.

Prefilter may have a negative impact on precision. Test the precision before using it.

Prefilter is enabled by default because it almost only works if you create a multicolumn vector index.

## Options

Search options are specified by PostgreSQL GUC. You can use `SET` command to apply these options in session or `SET LOCAL` command to apply these options in transaction.

Runtime parameters for planning a query:

| Option               | Type    | Default                  | Description                                                                  |
| -------------------- | ------- | ------------------------ | ---------------------------------------------------------------------------- |
| vectors.enable_index | boolean | `on`                     | Enables or disables the query planner's use of vector index-scan plan types. |
| vectors.search_mode  | boolean | `enum("basic", "vbase")` | Search mode.                                                                 |

Runtime parameters for executing a query:

| Option                   | Type                     | Default | Description                               |
| ------------------------ | ------------------------ | ------- | ----------------------------------------- |
| vectors.enable_prefilter | boolean                  | `on`    | Enables or disables the use of prefilter. |
| vectors.ivf_nprobe       | integer (`[1, 1000000]`) | `10`    | Number of lists to scan.                  |
| vectors.hnsw_ef_search   | integer (`[1, 65535]`)   | `100`   | Search scope of HNSW.                     |
