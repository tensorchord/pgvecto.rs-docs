# Monitoring

## Indexing Progress

You can check the indexing progress by querying the `pg_stat_progress_create_index` view.

For more detail about the view, please refer to the [PostgreSQL document](https://www.postgresql.org/docs/current/progress-reporting.html#CREATE-INDEX-PROGRESS-REPORTING)


```SQL
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;
```

## Phases

The `phase` column in `pg_stat_progress_create_index` view indicates the current processing phase of index creation.

There are five steps in the index construction process of `vchordrq`. The phase of each step are as follows:

| Step | Message                               | Description                                                  | Waiting time |
| ---- | ------------------------------------- | ------------------------------------------------------------ | ------------ |
| 1    | initializing                          | Start building index                                         | Short        |
| 2    | initializing index, by internal build | This step is only for internal build. It involves performing K-means clustering to obtain centroids | Long         |
| 2    | initializing index, by external build | This step is only for external build. It loads centroids from a specified table | Short        |
| 3    | initializing index                    | Initialize the data structure and storage of the index       | Short        |
| 4    | inserting tuples from table to index  | Assign all vectors to their corresponding cluster centers    | Long         |
| 5    | compacting tuples in index            | Optimize the structure of the vector index to enhance performance | Medium       |

:::info
The `blocks_done` and `blocks_total` columns indicate the progress of the 4th step `inserting tuples from table to index`.
:::