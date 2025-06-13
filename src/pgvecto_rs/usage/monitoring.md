# Monitoring

We provide a view `pg_vector_index_stat` to monitor the progress of indexing.

| Column       | Type   | Description                                                                         |
| ------------ | ------ | ----------------------------------------------------------------------------------- |
| tablerelid   | oid    | The oid of the table.                                                               |
| indexrelid   | oid    | The oid of the index.                                                               |
| tablename    | name   | The name of the table.                                                              |
| indexname    | name   | The name of the index.                                                              |
| idx_status   | text   | Its value is `NORMAL` or `UPGRADE`. Whether this index is normal or needs upgrade.  |
| idx_indexing | bool   | Not null if `idx_status` is `NORMAL`. Whether the background thread is indexing.    |
| idx_tuples   | int8   | Not null if `idx_status` is `NORMAL`. The number of tuples.                         |
| idx_sealed   | int8[] | Not null if `idx_status` is `NORMAL`. The number of tuples in each sealed segment.  |
| idx_growing  | int8[] | Not null if `idx_status` is `NORMAL`. The number of tuples in each growing segment. |
| idx_write    | int8   | Not null if `idx_status` is `NORMAL`. The number of tuples in write buffer.         |
| idx_size     | int8   | Not null if `idx_status` is `NORMAL`. The byte size for all the segments.           |
| idx_options  | text   | Not null if `idx_status` is `NORMAL`. The configuration of the index.               |

::: details `idx_options` Details
The `idx_options` is a JSON string that includes vector, segment, optimization, and indexing options. Examples below:

```json
{
    "vector": {
        "dimensions": 256,
        "distance": "L2",
        "kind": "F32"
    },
    "segment": {
        "max_growing_segment_size": 20000,
        "max_sealed_segment_size": 1000000
    },
    "optimizing": {
        "sealing_secs": 60,
        "sealing_size": 1,
        "delete_threshold": 0.2,
        "optimizing_threads": 2
    },
    "indexing": {
        "hnsw": {
            "m": 12,
            "ef_construction": 300,
            "quantization": {
                "trivial": {}
            }
        }
    }
}
```

:::

If there are no more insertions and you wait for all indexing to be finished, you can check the field `idx_indexing` every 60 seconds util it's `true`.
