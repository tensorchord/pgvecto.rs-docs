# Indexing Options

We utilize [TOML syntax](https://toml.io/en/v1.0.0) to express the index's configuration. Here's what each key in the configuration signifies:

| Key        | Type  | Description                            |
| ---------- | ----- | -------------------------------------- |
| segment    | table | Options for segments.                  |
| optimizing | table | Options for background optimizing.     |
| indexing   | table | The algorithm to be used for indexing. |

## Options for table `segment`

| Key                      | Type    | Range                | Default     | Description                           |
| ------------------------ | ------- | -------------------- | ----------- | ------------------------------------- |
| max_growing_segment_size | integer | `[1, 4_000_000_000]` | `20_000`    | Maximum size of unindexed vectors.    |
| max_sealed_segment_size  | integer | `[1, 4_000_000_000]` | `1_000_000` | Maximum size of vectors for indexing. |

## Options for table `optimizing`

| Key                | Type    | Range                | Default                     | Description                   |
| ------------------ | ------- | -------------------- | --------------------------- | ----------------------------- |
| optimizing_threads | integer | `[1, 65535]`         | sqrt of the number of cores | Maximum threads for indexing. |
| sealing_secs       | integer | `[1, 60]`            | `60`                        | See below.                    |
| sealing_size       | integer | `[1, 4_000_000_000]` | `1`                         | See below.                    |          |

If a write segment larger than `sealing_size` do not accept new data for `sealing_secs` seconds, the write segment will be turned to a sealed segment.

## Options for table `indexing`

| Key  | Type  | Description                                                             |
| ---- | ----- | ----------------------------------------------------------------------- |
| flat | table | If this table is set, brute force algorithm will be used for the index. |
| ivf  | table | If this table is set, IVF will be used for the index.                   |
| hnsw | table | If this table is set, HNSW will be used for the index.                  |

You can choose only one algorithm in above indexing algorithms. Default value is `hnsw`.

### Options for table `flat`

| Key          | Type  | Description                                |
| ------------ | ----- | ------------------------------------------ |
| quantization | table | The algorithm to be used for quantization. |

### Options for table `ivf`

| Key              | Type    | Range            | Default | Description                               |
| ---------------- | ------- | ---------------- | ------- | ----------------------------------------- |
| nlist            | integer | `[1, 1_000_000]` | `1000`  | Number of cluster units.                  |
| nsample          | integer | `[1, 1_000_000]` | `65536` | Number of samples for K-Means clustering. |
| least_iterations | integer | `[1, 1_000_000]` | `16`    | Least iterations for K-Means clustering.  |
| iterations       | integer | `[1, 1_000_000]` | `500`   | Max iterations for K-Means clustering.    |
| quantization     | table   |                  |         | The quantization algorithm to be used.    |

### Options for table `hnsw`

| Key             | Type    | Range        | Default | Description                            |
| --------------- | ------- | ------------ | ------- | -------------------------------------- |
| m               | integer | `[4, 128]`   | `12`    | Maximum degree of the node.            |
| ef_construction | integer | `[10, 2000]` | `300`   | Search scope in building.              |
| quantization    | table   |              |         | The quantization algorithm to be used. |

### Options for table `quantization`

| Key     | Type  | Description                                         |
| ------- | ----- | --------------------------------------------------- |
| trivial | table | If this table is set, no quantization is used.      |
| scalar  | table | If this table is set, scalar quantization is used.  |
| product | table | If this table is set, product quantization is used. |

You can choose only one algorithm in above indexing algorithms. Default value is `trivial`.

#### Options for table `product`

|  Key    | Type    | Range                                     | Default | Description                          |
| ------ | ------- | ----------------------------------------- | ------- | ------------------------------------ |
| sample | integer | `[1, 1_000_000]`                          | `65535` | Samples to be used for quantization. |
| ratio  | enum    | `"x4"`, `"x8"`, `"x16"`, `"x32"`, `"x64"` | `"x4"`  | Compression ratio for quantization.  |

Compression ratio is how many memory you are saved for saving vectors. For example, `"x4"` is $\frac{1}{4}$ compared to before. If you are creating indexes on `vecf16`, `"x4"` is $\frac{1}{2}$ compared to before.
