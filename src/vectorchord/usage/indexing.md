# Indexing

Similar to [ivfflat](https://github.com/pgvector/pgvector#ivfflat), VectorChord's index type `vchordrq` also divides vectors into lists and searches only a subset of lists closest to the query vector. It preserves the advantages of `ivfflat`, such as fast build times and lower memory consumption, while delivering [significantly better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than both hnsw and ivfflat.

To build a vector index, start by creating a table named `items` with an `embedding` column of type `vector(n)`, then populate it with sample data.

```sql
CREATE TABLE items (embedding vector(3));
INSERT INTO items (embedding) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
```

To create the VectorChord index, you can use the following SQL.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [1000]
build_threads = 16
$$);
```

> [!NOTE]
> - `options` are specified using a [TOML: Tom's Obvious Minimal Language](https://toml.io/) string. You can refer to [#Index Options](#indexing-options) for more information.
> - When dealing with large table, it will cost huge time and memory for `build.internal`. You can refer to [External Index Precomputation](../advanced-features/external-index-precomputation) to have a better experience.
> - The parameter `lists`, should be configured based on the number of rows. The following table provides guidance for this selection. When searching, set `vchordrq.probes` based on the value of `lists`.

| Number of Rows $N$                     | Recommended Number of Partitions $L$ | Example `lists` |
| -------------------------------------- | ------------------------------------ | --------------- |
| $N \in [0, 10^5)$                      | N/A                                  | `[]`            |
| $N \in [10^5, 2 \times 10^6)$          | $L = \frac{N}{500}$                  | `[2000]`        |
| $N \in [2 \times 10^6, 5 \times 10^7)$ | $L \in [4 \sqrt{N}, 8 \sqrt{N}]$     | `[10000]`       |
| $N \in [5 \times 10^7, \infty)$        | $L \in [8 \sqrt{N}, 16\sqrt{N}]$     | `[80000]`       |

Then the index will be built internally, and you can perform a vector search with the index.

```sql
SET vchordrq.probes = 10;
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

The table below shows all operator classes for types and operator in VectorChord.

## Operators and Operator Classes

### Vector Type

#### Distance/Similarity Operators

| Operator | Description                                                  | Operator Class      |
| -------- | ------------------------------------------------------------ | ------------------- |
| `<->`    | L2 distance                                                  | `vector_l2_ops`     |
| `<#>`    | Inner product                                                | `vector_ip_ops`     |
| `<=>`    | Cosine distance                                              | `vector_cosine_ops` |
| `@#`     | Multi-vector [MaxSim](/vectorchord/usage/multi-vector-retrieval) distance | `vector_maxsim_ops` |

#### Comparison operators

| Operator | Description                           | Operator Class      |
| -------- | ------------------------------------- | ------------------- |
| `<<->>`  | Tests if L2 distance <= threshold     | `vector_l2_ops`     |
| `<<#>>`  | Tests if inner product <= threshold   | `vector_ip_ops`     |
| `<<=>>`  | Tests if cosine distance <= threshold | `vector_cosine_ops` |

See also: [Range Filter](search#range-filter)

### Halfvec Type

#### Distance/Similarity Operators

| Operator | Description                                                  | Operator Class       |
| -------- | ------------------------------------------------------------ | -------------------- |
| `<->`    | L2 distance                                                  | `halfvec_l2_ops`     |
| `<#>`    | Inner product                                                | `halfvec_ip_ops`     |
| `<=>`    | Cosine distance                                              | `halfvec_cosine_ops` |
| `@#`     | Multi-vector [MaxSim](/vectorchord/usage/multi-vector-retrieval) distance | `vector_maxsim_ops` |

### Comparison operators

| Operator | Description                           | Operator Class       |
| -------- | ------------------------------------- | -------------------- |
| `<<->>`  | Tests if L2 distance <= threshold     | `halfvec_l2_ops`     |
| `<<#>>`  | Tests if inner product <= threshold   | `halfvec_ip_ops`     |
| `<<=>>`  | Tests if cosine distance <= threshold | `halfvec_cosine_ops` |

See also: [Range Filter](search#range-filter)

## Indexing Options

### `residual_quantization`

- Description: This index parameter determines whether residual quantization is used. If you not familiar with residual quantization, you can read this [blog](https://drscotthawley.github.io/blog/posts/2023-06-12-RVQ.html) for more information. Shortly, residual quantization is a technique that improves the accuracy of vector search by quantizing the residuals of the vectors.
- Type: boolean
- Default: `false`
- Example:
    - `residual_quantization = false` means that residual quantization is not used.
    - `residual_quantization = true` means that residual quantization is used.

### `rerank_in_table` <badge type="tip" text="since v0.2.1" />

- Description: This index parameter determines whether the vectors are fetched from the table. If so, the index will require less storage, but the query latency will increase significantly. It should only be enabled when disk space is extremely limited.
- Type: boolean
- Default: `false`
- Example:
    - `rerank_in_table = false` that vectors are stored in both the index and the table, and fetched from the index in search.
    - `rerank_in_table = true` that vectors are stored in the table only, and fetched from the table in search.
- See also: [Rerank In Table](../advanced-features/rerank-in-table)

### `build.pin` <badge type="tip" text="since v0.2.1" />

- Description: This index parameter determines whether shared memory is used for indexing. For large datasets, you can choose to enable this option to speed up the build process.
- Type: boolean
- Default: `false`
- Example:
    - `build.pin = false` means that shared memory is not used.
    - `build.pin = true` means that shared memory is used.

## Internal Build Parameters

The following parameters are available:

### `build.internal.lists`

- Description: This index parameter determines the hierarchical structure of the vector space partitioning.
- Type: list of integers
- Default:
    - `[]` <badge type="tip" text="since v0.3.0" />
    - `[1000]` <badge type="tip" text="until v0.2.2: implicit behavior is not ideal" />
- Example:
    - `build.internal.lists = []` means that the vector space is not partitioned.
    - `build.internal.lists = [4096]` means the vector space is divided into $4096$ cells.
    - `build.internal.lists = [4096, 262144]` means the vector space is divided into $4096$ cells, and those cells are further divided into $262144$ smaller cells.
- Note: The index partitions the vector space into multiple Voronoi cells using centroids, iteratively creating a hierarchical space partition tree. Each leaf node in this tree represents a region with an associated list storing vectors in that region. During insertion, vectors are placed in lists corresponding to their appropriate leaf nodes. For queries, the index optimizes search by excluding lists whose leaf nodes are distant from the query vector, effectively pruning the search space. If the length of `lists` is 1,the `lists` option should be no less than $4 * \sqrt{N}$, where $N$ is the number of vectors in the table.

### `build.internal.spherical_centroids`

- Description: This index parameter determines whether perform spherical K-means -- the centroids are L2 normalized after each iteration, you can refer to option `spherical` in [here](https://github.com/facebookresearch/faiss/wiki/Faiss-building-blocks:-clustering,-PCA,-quantization#additional-options).
- Type: boolean
- Default: `false`
- Example:
    - `build.internal.spherical_centroids = false` means that spherical k-means is not performed.
    - `build.internal.spherical_centroids = true` means that spherical k-means is performed.
- Note: Set this to `true` if your model generates embeddings where the metric is cosine similarity.

### `build.internal.sampling_factor` <badge type="tip" text="since v0.2.0" />

- Description: This index parameter determines the number of vectors the K-means algorithm samples per cluster. The higher this value, the slower the build, the greater the memory consumption in building, and the better search performance.
- Type: integer
- Domain: `[0, 1024]`
- Default: `256`
- Example:
    - `build.internal.sampling_factor = 256` means that the K-means algorithm samples $256 * count(clusters)$ vectors.
    - `build.internal.sampling_factor = 1024` means that the K-means algorithm samples $1024 * count(clusters)$ vectors.

### `build.internal.kmeans_iterations` <badge type="tip" text="since v0.2.2" />

- Description: This index parameter determines the number of iterations for K-means algorithm. The higher this value, the slower the build.
- Type: integer
- Domain: `[0, 1024]`
- Default: `10`
- Example:
    - `build.internal.kmeans_iterations = 10` means that the K-means algorithm performs $10$ iterations.
    - `build.internal.kmeans_iterations = 100` means that the K-means algorithm performs $100$ iterations.

### `build.internal.build_threads`

- Description: This index parameter determines the number of threads used by K-means algorithm. The higher this value, the faster the build, and greater load on the server in building.
- Type: integer
- Domain: `[1, 255]`
- Default: `1`
- Example:
    - `build.internal.build_threads = 1` means that the K-means algorithm uses $1$ thread.
    - `build.internal.build_threads = 4` means that the K-means algorithm uses $4$ threads.
