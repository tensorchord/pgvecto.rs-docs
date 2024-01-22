# Indexing

Indexing is the process of building a data structure that allows for efficient search. `pgvecto.rs` supports three indexing algorithms: brute force (FLAT), IVF, and HNSW. The default algorithm is HNSW.

Assuming there is a table `items` and there is a column named `embedding` of type `vector(n)`, you can create a vector index for squared Euclidean distance with the following SQL.

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops);
```

The `vector_l2_ops` is an operator class for squared Euclidean distance. There are all operator classes for each vector type and distance type.

| Vector type | Distance type              | Operator class |
| ----------- | -------------------------- | -------------- |
| vector      | squared Euclidean distance | vector_l2_ops  |
| vector      | negative dot product       | vector_dot_ops |
| vector      | cosine distance            | vector_cos_ops |
| vecf16      | squared Euclidean distance | vecf16_l2_ops  |
| vecf16      | negative dot product       | vecf16_dot_ops |
| vecf16      | cosine distance            | vecf16_cos_ops |

Now you can perform a KNN search with the following SQL again, this time the vector index is used for searching.

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

::: details

`pgvecto.rs` constructs the index asynchronously. When you insert new rows into the table, they will first be placed in an append-only file. The background thread will periodically merge the newly inserted row to the existing index. When a user performs any search prior to the merge process, it scans the append-only file to ensure accuracy and consistency.

:::

## Options

We utilize [TOML syntax](https://toml.io/en/v1.0.0) to express the index's configuration. Here's what each key in the configuration signifies:

| Key        | Type  | Description                            |
| ---------- | ----- | -------------------------------------- |
| segment    | table | Options for segments.                  |
| optimizing | table | Options for background optimizing.     |
| indexing   | table | The algorithm to be used for indexing. |

Options for table `segment`.

| Key                      | Type    | Range                | Default     | Description                           |
| ------------------------ | ------- | -------------------- | ----------- | ------------------------------------- |
| max_growing_segment_size | integer | `[1, 4_000_000_000]` | `20_000`    | Maximum size of unindexed vectors.    |
| max_sealed_segment_size  | integer | `[1, 4_000_000_000]` | `1_000_000` | Maximum size of vectors for indexing. |

Options for table `optimizing`.

| Key                | Type    | Range                | Default                     | Description                   |
| ------------------ | ------- | -------------------- | --------------------------- | ----------------------------- |
| optimizing_threads | integer | `[1, 65535]`         | sqrt of the number of cores | Maximum threads for indexing. |
| sealing_secs       | integer | `[1, 60]`            | `60`                        | See below.                    |
| sealing_size       | integer | `[1, 4_000_000_000]` | `1`                         | See below.                    |

If a write segment larger than `sealing_size` do not accept new data for `sealing_secs` seconds, the write segment will be turned to a sealed segment.

Options for table `indexing`.

| Key  | Type  | Description                                                             |
| ---- | ----- | ----------------------------------------------------------------------- |
| flat | table | If this table is set, brute force algorithm will be used for the index. |
| ivf  | table | If this table is set, IVF will be used for the index.                   |
| hnsw | table | If this table is set, HNSW will be used for the index.                  |

You can choose only one algorithm in above indexing algorithms. Default value is `hnsw`.

Options for table `flat`.

| Key          | Type  | Description                                |
| ------------ | ----- | ------------------------------------------ |
| quantization | table | The algorithm to be used for quantization. |

Options for table `ivf`.

| Key              | Type    | Range            | Default | Description                               |
| ---------------- | ------- | ---------------- | ------- | ----------------------------------------- |
| nlist            | integer | `[1, 1_000_000]` | `1000`  | Number of cluster units.                  |
| nsample          | integer | `[1, 1_000_000]` | `65536` | Number of samples for K-Means clustering. |
| least_iterations | integer | `[1, 1_000_000]` | `16`    | Least iterations for K-Means clustering.  |
| iterations       | integer | `[1, 1_000_000]` | `500`   | Max iterations for K-Means clustering.    |
| quantization     | table   |                  |         | The quantization algorithm to be used.    |

Options for table `hnsw`.

| Key             | Type    | Range        | Default | Description                            |
| --------------- | ------- | ------------ | ------- | -------------------------------------- |
| m               | integer | `[4, 128]`   | `12`    | Maximum degree of the node.            |
| ef_construction | integer | `[10, 2000]` | `300`   | Search scope in building.              |
| quantization    | table   |              |         | The quantization algorithm to be used. |

Options for table `quantization`.

| Key     | Type  | Description                                         |
| ------- | ----- | --------------------------------------------------- |
| trivial | table | If this table is set, no quantization is used.      |
| scalar  | table | If this table is set, scalar quantization is used.  |
| product | table | If this table is set, product quantization is used. |

You can choose only one algorithm in above indexing algorithms. Default value is `trivial`.

Options for table `product`.

| Key    | Type    | Range                                     | Default | Description                          |
| ------ | ------- | ----------------------------------------- | ------- | ------------------------------------ |
| sample | integer | `[1, 1_000_000]`                          | `65535` | Samples to be used for quantization. |
| ratio  | enum    | `"x4"`, `"x8"`, `"x16"`, `"x32"`, `"x64"` | `"x4"`  | Compression ratio for quantization.  |

Compression ratio is how many memory you are saved for saving vectors. For example, `"x4"` is $\frac{1}{4}$ compared to before. If you are creating indexes on `vecf16`, `"x4"` is $\frac{1}{2}$ compared to before.

## Examples

There are some examples.

```sql
-- HNSW algorithm, default settings.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops);

--- Or using bruteforce with PQ.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.flat]
quantization.product.ratio = "x16"
$$);

--- Or using IVFPQ algorithm.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.ivf]
quantization.product.ratio = "x16"
$$);

-- Use more threads for background building the index.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
optimizing.optimizing_threads = 16
$$);

-- Prefer smaller HNSW graph.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
segment.max_growing_segment_size = 200000
$$);
```
