# Search

Get the nearest 5 neighbors to a vector

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

## Operators

These operators are used for distance metrics:

| Name  | Description                |
| ----- | -------------------------- |
| `<->` | squared Euclidean distance |
| `<#>` | negative dot product       |
| `<=>` | cosine distance            |

## Filter

For a given category, get the nearest 10 neighbors to a vector
```sql
SELECT 1 FROM items WHERE category_id = 1 ORDER BY embedding <#> '[0.5,0.5,0.5]' limit 10
```

## Range Filter

To query vectors within a certain distance range, you can use the following syntax.
```SQL
-- Query vectors within a certain distance range
SELECT * FROM items WHERE embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012);
```

The expression `sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` refers to a spherical region with its center at `'[0.24, 0.24, 0.24]'` and a radius of `0.012`.

The expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` evaluates to `true` if the embedding is within the spherical region. Semantically, this is equivalent to `embedding <-> '[0.24, 0.24, 0.24]' < 0.012`.

However, the expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` can be correctly handled by the `vchordrq` index, while the expression `embedding <-> '[0.24, 0.24, 0.24]' < 0.012` can't.

These comparison operators are used for range filter:

| Operator | Description                           |
| -------- | ------------------------------------- |
| `<<->>`  | Tests if L2 distance <= threshold     |
| `<<#>>`  | Tests if inner product <= threshold   |
| `<<=>>`  | Tests if cosine distance <= threshold |

:::warning
[Multi-Vector Retrieval (MaxSim search)](./multi-vector-retrieval) does not support range query yet.
:::

## Query options

#### `vchordrq.probes`

- Description: This GUC parameter `vchordrq.probes` controls how the vector space assists in query pruning. The more probes, the more accurate the search, but also the slower it is.
- Type: list of integers
- Default:
    - ` ` <badge type="tip" text="since v0.3.0" />
    - `10` <badge type="tip" text="until v0.2.2: default value of lists is changed to empty list" />
- Example:
    - `SET vchordrq.probes = 1` means that only one probe is used.
    - `SET vchordrq.probes = 10` means that ten probes are used.
- Note: The default value is an empty list. The length of this option must match the length of `lists`. 
    - If `lists = []`, then probes must be an empty list.
    - If `lists = [11, 22]`, then probes can be 2,4 or 4,8, but it must not be an empty list, `3`, `7,8,9`, or `5,5,5,5`.
- See also: [Query Performance Tuning](performance-tuning.md#query-performance)

#### `vchordrq.epsilon`

- Description: Even after pruning, the number of retrieved vectors remains substantial. The index employs the RaBitQ algorithm to quantize vectors into bit vectors, which require just $\frac{1}{32}$ the memory of single-precision floating-point vectors. With minimal floating-point operations, most computations are integer-based, leading to faster processing. Unlike typical quantization algorithms, RaBitQ not only estimates distances but also their lower bounds. The index computes the lower bound for each vector and dynamically adjusts the number of vectors needing recalculated distances, based on the query count, thus balancing performance and accuracy. The GUC parameter `vchordrq.epsilon` controls the conservativeness of the lower bounds of distances. The higher the value, the higher the accuracy, but the worse the performance. The default value provides unnecessarily high accuracy for most indexes, so you can try lowering this parameter to achieve better performance.
- Type: float
- Default: `1.9`
- Domain: `[0.0, 4.0]`
- Example:
    - `SET vchordrq.epsilon = 0.1` indicates you are using a very optimistic lower bound estimation. You set it this way because your dataset is not sensitive to the lower bound estimation, for the precision you need.
    - `SET vchordrq.epsilon = 4.0` indicates you are using a very pessimistic lower bound estimation. You set it this way because your dataset is not very sensitive to the lower bound estimation, for the precision you need.
- Note: The default value is `1.9`. The acceptable range is from `0.0` to `4.0`.
- See also: [Query Performance Tuning](performance-tuning.md#query-performance)

#### `vchordrq.prefilter` <badge type="tip" text="since v0.4.0" />

- Description: The `vchordrq.prefilter` GUC parameter enables condition evaluation before distance computation. For example, in the query `SELECT * FROM items WHERE id % 2 = 0 ORDER BY embedding <-> '[3,1,2]' LIMIT 5`, the index normally computes all useful `embedding <-> '[3,1,2]'` distances first and then pass the rows to PostgreSQL, which filters out rows where `id % 2 != 0`. This parameter allows the index to pre-evaluate the condition and discard non-matching rows before computing their distances, improving query efficiency.
- Type: boolean
- Default: `false`
- See also: [Prefiltering](../advanced-features/prefiltering)

#### `vchordrq.io_search` <badge type="tip" text="since v0.4.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading bit vectors in vector search, which can impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 13, 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 13, 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.
- See also: [Prefetch Mode](../advanced-features/prefetch#prefetch-mode)

#### `vchordrq.io_rerank` <badge type="tip" text="since v0.4.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading full precision vectors in vector search, which can significantly impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 13, 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 13, 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.
- See also: [Prefetch Mode](../advanced-features/prefetch#prefetch-mode)

#### `vchordrq.prewarm_dim` <badge type="danger" text="deprecated in v0.4.0" />	

- Description: The `vchordrq.prewarm_dim` GUC parameter is used to precompute the RaBitQ projection matrix for the specified dimensions. This can help to reduce the latency of the first query after the PostgreSQL cluster is started.
- Type: list of integers
- Default: `64,128,256,384,512,768,1024,1536`
- Example:
    - `ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128'` means that the projection matrix will be precomputed for dimensions 64 and 128.
- Note:
    - This setting requires a database restart to take effect.
    - Since `v0.4.0`, algorithm improvements makes it unnecessary so this option is removed.