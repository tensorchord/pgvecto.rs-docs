# Search

Get the nearest 5 neighbors to a vector
```sql
SET vectors.hnsw_ef_search = 64;
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

## Operators

These operators are used for distance metrics:

| Name  | Description                |
| ----  | -------------------------- |
| <->   | squared Euclidean distance |
| <#>   | negative dot product       |
| <=>   | cosine distance            |

For their definitions, see [overview](../getting-started/overview).

## Filter

For a given category, get the nearest 10 neighbors to a vector
```sql
SELECT 1 FROM items WHERE category_id = 1 ORDER BY embedding <#> '[0.5,0.5,0.5]' limit 10
```

## Query options

Set `ivf` scan lists to 1 in session:
```sql
SET vectors.ivf_nprobe=1;
```

Set `hnsw` search scope to 40 in transaction:
```sql
SET LOCAL vectors.hnsw_ef_search=40;
```

For all options, refer to [search options](../reference/search_options.html).

## Search modes

There are two search modes: `vbase` and `basic`.

### `vbase`

As the default search mode, `vbase` is suitable for most scenarios.

For how it works, refer to the thesis [VBASE: Unifying Online Vector Similarity Search and Relational Queries via Relaxed Monotonicity](https://www.usenix.org/conference/osdi23/presentation/zhang-qianxi).

### `basic`

`basic` is behaviorally consistent with vector algorithm libraries such as `faiss`.
It will be useful if you want to align them.

Enabling `basic`, you must respect these restrictions:
* Execute [VACUUM](https://www.postgresql.org/docs/current/sql-vacuum.html) after updates before searches.
* Search without filter

