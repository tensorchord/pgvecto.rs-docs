# Search Options

Search options are specified by [PostgreSQL GUC](https://www.postgresql.org/docs/current/config-setting.html).

## Options for `ivf`

These options only work for IVF algorithm.
Refer to [Indexing](../usage/indexing.html#inverted-file-index-ivf).

| Option                   | Type    | Range            | Default | Description                               |
| ------------------------ | ------- | ---------------- | ------- | ----------------------------------------- |
| vectors.ivf_nprobe       | integer | `[1, 1_000_000]` | `10`    | Number of lists to scan.                  |

## Options for `hnsw`

These options only work for HNSW algorithm.
Refer to [Indexing](../usage/indexing.html#hierarchical-navigable-small-world-graph-hnsw).

| Option                   | Type    | Range          | Default | Description                               |
| ------------------------ | ------- | -------------- | ------- | ----------------------------------------- |
| vectors.hnsw_ef_search   | integer | `[1, 65535]`   | `100`   | Search scope of HNSW.                     |

## Other Options

Query options for search mode:
.

| Option                         | Type    | Range              | Default   | Description                            |
| ------------------------------ | ------- | ------------------ | --------- | -------------------------------------- |
| vectors.search_mode            | enum    | `"basic", "vbase"` | `"vbase"` | Search mode, Refer to [Search](../usage/search.html#search-modes)                                                     |
| vectors.pgvector_compatibility | boolean |                    | `off`     | Enable or disable `pgvector` compatibility, Refer to [pgvector compatibility](../usage/compatibility.html) |
| vectors.enable_index           | boolean |                    | `on`      | Enable or disable the query planner's use of vector types.                                                              |