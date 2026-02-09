# Graph Index <badge type="tip" text="since v0.5.0" />

VectorChord's index type `vchordg` is a disk-based graph index. It has low memory consumption.

Let's start by creating a table named `items` with an `embedding` column of type `vector(n)`, and then populate it with sample data.

To create a `vchordg` index, you can use the following SQL.

```sql
CREATE INDEX ON items USING vchordg (embedding vector_l2_ops);
```

::: tip
This feature is in preview.
:::

## Tuning

When building an index, two options usually need tuning: `m` and `ef_construction`. `m` is the maximum number of neighbors per vertex, and `ef_construction` is the size of the dynamic list containing the nearest neighbors during insertion.

In search, you need to tune `ef_search`. `ef_search` is the size of the dynamic list containing the nearest neighbors during search.

```sql
CREATE INDEX ON items USING vchordg (embedding vector_l2_ops) WITH (options = $$
m = 64
ef_construction = 128
$$);

SET vchordg.ef_search TO '128';
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

As a disk-based index, `vchordg` usually requires only the quantized vectors to be kept in the buffer pool to maintain performance. By default, `vchordg` quantizes a $D$-dimensional vector to $2D$ bits. Let the number of rows be $N$. Then, the total memory required for the index is $2DN$ bits. If you have very limited memory and are using ultra-high dimensional vectors, consider quantizing a vector to $D$ bits. Then, the total memory required for the index is $DN$ bits.

```sql
CREATE INDEX ON items USING vchordg (embedding vector_l2_ops) WITH (options = $$
bits = 1
m = 64
ef_construction = 128
$$);
```

The index building can be sped up by using multiple processes. Refer to [PostgreSQL Tuning](performance-tuning.md).

## Reference

### Operator Classes <badge type="info" text="vchordg" /> {#operator-classes}

The following table lists all available operator classes supported by `vchordg`.

| Operator Class       | Description                                               | Operator 1             | Operator 2               |
| -------------------- | --------------------------------------------------------- | ---------------------- | ------------------------ |
| `vector_l2_ops`      | index works for `vector` type and Euclidean distance      | `<->(vector,vector)`   | `<<->>(vector,vector)`   |
| `vector_ip_ops`      | index works for `vector` type and negative inner product  | `<#>(vector,vector)`   | `<<#>>(vector,vector)`   |
| `vector_cosine_ops`  | index works for `vector` type and cosine distance         | `<=>(vector,vector)`   | `<<=>>(vector,vector)`   |
| `halfvec_l2_ops`     | index works for `halfvec` type and Euclidean distance     | `<->(halfvec,halfvec)` | `<<->>(halfvec,halfvec)` |
| `halfvec_ip_ops`     | index works for `halfvec` type and negative inner product | `<#>(halfvec,halfvec)` | `<<#>>(halfvec,halfvec)` |
| `halfvec_cosine_ops` | index works for `halfvec` type and cosine distance        | `<=>(halfvec,halfvec)` | `<<=>>(halfvec,halfvec)` |
| `rabitq8_l2_ops`     | index works for `rabitq8` type and Euclidean distance     | `<->(rabitq8,rabitq8)` | `<<->>(rabitq8,rabitq8)` |
| `rabitq8_ip_ops`     | index works for `rabitq8` type and negative inner product | `<#>(rabitq8,rabitq8)` | `<<#>>(rabitq8,rabitq8)` |
| `rabitq8_cosine_ops` | index works for `rabitq8` type and cosine distance        | `<=>(rabitq8,rabitq8)` | `<<=>>(rabitq8,rabitq8)` |
| `rabitq4_l2_ops`     | index works for `rabitq4` type and Euclidean distance     | `<->(rabitq4,rabitq4)` | `<<->>(rabitq4,rabitq4)` |
| `rabitq4_ip_ops`     | index works for `rabitq4` type and negative inner product | `<#>(rabitq4,rabitq4)` | `<<#>>(rabitq4,rabitq4)` |
| `rabitq4_cosine_ops` | index works for `rabitq4` type and cosine distance        | `<=>(rabitq4,rabitq4)` | `<<=>>(rabitq4,rabitq4)` |

`<<->>`, `<<#>>`, `<<=>>` are operators defined by VectorChord. For more information about `<<->>`, `<<#>>`, `<<=>>`, refer to [Similarity Filter](range-query).

`rabitq8`, `rabitq4` are types defined by VectorChord. For more information about `rabitq8`, `rabitq4`, refer to [Quantization Types](quantization-types).

The first 6 operator classes are available since version `0.5.0`, and the last 6 operator classes are available since version `1.1.0`.

### Indexing Options <badge type="info" text="vchordg" />

#### `bits` <badge type="tip" text="since v0.5.0" />

- Description: The ratio of bits to dimensions after RaBitQ quantization. `bits = 2` provides better recall and QPS, while `bits = 1` consumes less memory.
- Type: integer
- Default: `2`
- Example:
    - `bits = 2` means a $D$-dimensional vector is quantized to $2D$ bits.
    - `bits = 1` means a $D$-dimensional vector is quantized to $D$ bits .

#### `m` <badge type="tip" text="since v0.5.0" />

- Description: The maximum number of neighbors per vertex. The larger `m` is, the better the performance, but the higher the storage requirement. `m` corresponds to $m_0$ in HNSW and $m$ in DiskANN.
- Type: integer
- Default: `32`
- Example:
    - `m = 32` means that there are at most $32$ neighbors per vertex.
    - `m = 64` means that there are at most $64$ neighbors per vertex.

#### `ef_construction` <badge type="tip" text="since v0.5.0" />

- Description: The size of the dynamic list containing the nearest neighbors during insertion. The larger `ef_construction` is, the better the performance, but the slower the insertion. `ef_construction` corresponds to $\text{ef}_\text{construction}$ in HNSW and $\text{ef}_C$ in DiskANN.
- Type: integer
- Default: `64`
- Example:
    - `ef_construction = 64` means that the size of the dynamic list containing the nearest neighbors is $64$ during insertion.
    - `ef_construction = 128` means that the size of the dynamic list containing the nearest neighbors is $128$ during insertion.

#### `alpha` <badge type="tip" text="since v0.5.0" />

- Description: The `alpha` values selected during pruning. `alpha` corresponds to $\alpha$ in DiskANN. This option must be an ascending list, where the first element is `1.0` and the last element is less than `2.0`.
- Type: list of floats
- Default: `[1.0, 1.2]`
- Example:
    - `alpha = [1.0, 1.2]` is equivalent to setting `alpha = 1.2` in DiskANN.
    - `alpha = [1.0]` is equivalent to the default pruning strategy in HNSW.
- Note: this option is ineffective when the distance metric is negative inner product.

#### `beam_construction` <badge type="tip" text="since v0.5.0" />

- Description: Beam width used during insertion. Beam width refers to the number of vertices accessed at once. Since the time to randomly read a small number of sectors from the SSD is almost the same as reading a single sector, a larger beam width effectively reduces the number of round trips to the SSD, resulting in better performance. Since it increases computation, it is disadvantageous for indexes that fit entirely in memory.
- Type: integer
- Default: `1`
- Example:
    - `beam_construction = 8` means that the index accesses 8 vertices at once during insertion.
    - `beam_construction = 1` means that the index accesses 1 vertex at once during insertion.

### Search Parameters <badge type="info" text="vchordg" />

#### `vchordg.enable_scan` <badge type="tip" text="since v0.5.0" />

- Description: Enables or disables the query planner's use of `vchordg` index scan. It's for testing purposes.
- Type: boolean
- Default: `on`
- Example:
    - `vchordg.enable_scan = off` disables the query planner's use of `vchordg` index scan.
    - `vchordg.enable_scan = on` enables the query planner's use of `vchordg` index scan.

#### `vchordg.ef_search` <badge type="tip" text="since v0.5.0" /> {#search-parameters-vchordg-ef-search}

- Description: The size of the dynamic list containing the nearest neighbors in search. The larger `vchordg.ef_search` is, the better the recall, but the worse the QPS. `vchordg.ef_search` corresponds to $\text{ef}$ in HNSW and DiskANN.
- Type: integer
- Default:
    - `64`
    - This parameter supports [fallback](fallback-parameters).
- Domain: `[1, 65535]`
- Example:
    - `SET vchordg.ef_search = 64` indicates the size of the dynamic list containing the nearest neighbors is $64$ during search.
    - `SET vchordg.ef_search = 128` indicates the size of the dynamic list containing the nearest neighbors is $128$ during search.

#### `vchordg.beam_search` <badge type="tip" text="since v0.5.0" />

- Description: Beam widths used during search. Beam width refers to the number of vertices accessed at once. Since the time to randomly read a small number of sectors from the SSD is almost the same as reading a single sector, a larger beam width effectively reduces the number of round trips to the SSD, resulting in better performance. Since it increases computation, it is disadvantageous for indexes that fit entirely in memory.
- Type: integer
- Default: `1`
- Domain: `[1, 65535]`
- Example:
    - `SET vchordg.beam_search = 8` indicates that the index accesses 8 vertices at once during search.
    - `SET vchordg.beam_search = 1` indicates that the index accesses 1 vertex at once during search.

#### `vchordg.max_scan_tuples` <badge type="tip" text="since v0.5.0" />

- Description: The GUC parameter `vchordg.max_scan_tuples` controls the maximum number of tuples that can be scanned in a vector search. In most cases, you do not need to set this parameter, because the `LIMIT` clause serves a similar purpose. However, when a `WHERE` clause is present, the `LIMIT` clause applies after filtering, while this GUC parameter applies before filtering. This parameter is intended to prevent performance degradation when the filtering selectivity is very low.
- Type: integer
- Default: `-1`
- Domain: `[-1, 2147483647]`
- Example:
  - `SET vchordg.max_scan_tuples = 999` indicates the index scan returns at most $999$ tuples.
  - `SET vchordg.max_scan_tuples = -1` indicates no limit on the number of tuples.
- Note: This parameter has no effect when set to `-1`.
