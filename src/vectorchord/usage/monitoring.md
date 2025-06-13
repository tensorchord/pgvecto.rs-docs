# Monitoring

## Indexing Progress

You can check the indexing progress by querying the `pg_stat_progress_create_index` view.

For more detail aboutn the view, please see the [PostgreSQL document](https://www.postgresql.org/docs/current/progress-reporting.html#CREATE-INDEX-PROGRESS-REPORTING)


```SQL
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;
```

## Phrases

The `phrase` column in `pg_stat_progress_create_index` view indicates the current processing phase of index creation.

There are five steps in the index construction process of VectorChord. The phrases of each step are as follows:

| Step | Message                               | Description                                                  | Execution speed |
| ---- | ------------------------------------- | ------------------------------------------------------------ | --------------- |
| 1    | initializing                          | Start building index                                         | Extremely fast  |
| 2.1  | initializing index, by internal build | This step is only for internal build. It involves performing K-means clustering to obtain centroids | Slow            |
| 2.2  | initializing index, by external build | This step is only for external build. It loads centroids from a specified table | Fast            |
| 3    | initializing index                    | Initialize the data structure and storage of the index       | Fast            |
| 4    | inserting tuples from table to index  | Assign all vectors to their corresponding cluster centers    | Slow            |
| 5    | compacting tuples in index            | Optimize the structure of the vector index to enhance performance | Medium          |

:::info
The progress calculated from the `blocks_done` and `blocks_total` columns is only valid for the 4th step: inserting tuples from the table to the index.
:::