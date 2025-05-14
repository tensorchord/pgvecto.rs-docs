# Indexing

Similar to [ivfflat](https://github.com/pgvector/pgvector#ivfflat), VectorChord's index type RaBitQ(vchordrq) also divides vectors into lists and searches only a subset of lists closest to the query vector. It preserves the advantages of `ivfflat`, such as fast build times and lower memory consumption, while delivering [significantly better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than both hnsw and ivfflat.

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

Then the index will be built internally, and you can perform a vector search with the index.

```sql
SET vchordrq.probes = 10;
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

The table below shows the operator classes for types and operator in the index.

|                         | vector              | halfvec              |
| ----------------------- | ------------------- | -------------------- |
| L2 distance (`<->`)     | `vector_l2_ops`     | `halfvec_l2_ops`     |
| inner product (`<#>`)   | `vector_ip_ops`     | `halfvec_ip_ops`     |
| cosine distance (`<=>`) | `vector_cosine_ops` | `halfvec_cosine_ops` |

## Recommendations

When dealing with large datasets (> $10^6$ vectors), please follow these guidelines for optimal performance:

1. First insert all vectors into the table before building the index
2. Select an appropriate number of lists (`build.internal.lists` parameter) based on your dataset size
3. The `lists` option should be configured based on the number of vectors. Below is a table to assist with your selection
4. Failure to follow these steps may result in significantly increased query latency

> [!NOTE]
> VectorChord's index leverages statistical properties of your dataset to optimize search performance. If you significantly update your vector data after building the index, the index efficiency may degrade. In such cases, rebuilding the index is recommended to restore optimal performance.

| vectors Range | List Calculation Formula       | Example Result   |
| ------------- | ------------------------------ | ---------------- |
| <128k         | list = 1                       | 1                |
| ≥128k and <2M | list = (2 * vectors) / 1000    | [256, 4000]      |
| ≥2M and <100M | list ∈ [4√vectors, 8√vectors]  | \[4000, 80000]   |
| ≥100M         | list ∈ [8√vectors, 16√vectors] | \[80000, 160000] |

## Indexing Options

#### `residual_quantization`
    
- Description: This index parameter determines whether residual quantization is used. If you not familiar with residual quantization, you can read this [blog](https://drscotthawley.github.io/blog/posts/2023-06-12-RVQ.html) for more information. Shortly, residual quantization is a technique that improves the accuracy of vector search by quantizing the residuals of the vectors.
- Type: boolean
- Default: `false`
- Example:
    - `residual_quantization = false` means that residual quantization is not used.
    - `residual_quantization = true` means that residual quantization is used.
- Note: set `residual_quantization` to `true` if your model generates embeddings where the metric is Euclidean distance. This option only works for L2 distance. Using it with other distance metrics will result in an error in building.

### Internal Build Parameters

The following parameters are available:

#### `build.internal.lists`
    
- Description: This index parameter determines the hierarchical structure of the vector space partitioning.
- Type: list of integers
- Default: `[]`
- Example:
    - `build.internal.lists = []` means that the vector space is not partitioned.
    - `build.internal.lists = [4096]` means the vector space is divided into $4096$ cells.
    - `build.internal.lists = [4096, 262144]` means the vector space is divided into $4096$ cells, and those cells are further divided into $262144$ smaller cells.
- Note: The index partitions the vector space into multiple Voronoi cells using centroids, iteratively creating a hierarchical space partition tree. Each leaf node in this tree represents a region with an associated list storing vectors in that region. During insertion, vectors are placed in lists corresponding to their appropriate leaf nodes. For queries, the index optimizes search by excluding lists whose leaf nodes are distant from the query vector, effectively pruning the search space. If the length of `lists` is 1,the `lists` option should be no less than $4 * \sqrt{N}$, where $N$ is the number of vectors in the table.

#### `build.internal.spherical_centroids`

- Description: This index parameter determines whether perform spherical K-means -- the centroids are L2 normalized after each iteration, you can refer to option `spherical` in [here](https://github.com/facebookresearch/faiss/wiki/Faiss-building-blocks:-clustering,-PCA,-quantization#additional-options).
- Type: boolean
- Default: `false`
- Example:
    - `build.internal.spherical_centroids = false` means that spherical k-means is not performed.
    - `build.internal.spherical_centroids = true` means that spherical k-means is performed.
- Note: Set this to `true` if your model generates embeddings where the metric is cosine similarity.

#### `build.internal.sampling_factor`
    
- Description: This index parameter determines the number of vectors sampled by K-means algorithm. The higher this value, the slower the build, the greater the memory consumption in building, and the better search performance.
- Type: integer
- Default: `256`
- Example:
    - `build.internal.sampling_factor = 256` means that the K-means algorithm samples $256$ vectors.
    - `build.internal.sampling_factor = 1024` means that the K-means algorithm samples $1024$ vectors.

#### `build.internal.kmeans_iterations`
    
- Description: This index parameter determines the number of iterations for K-means algorithm. The higher this value, the slower the build.
- Type: integer
- Domain: `[0, 1024]`
- Default: `10`
- Example:
    - `build.internal.kmeans_iterations = 10` means that the K-means algorithm performs $10$ iterations.
    - `build.internal.kmeans_iterations = 100` means that the K-means algorithm performs $100$ iterations.

#### `build.internal.build_threads`
    
- Description: This index parameter determines the number of threads used by K-means algorithm. The higher this value, the faster the build, and greater load on the server in building.
- Type: integer
- Domain: `[1, 255]`
- Default: `1`
- Example:
    - `build.internal.build_threads = 1` means that the K-means algorithm uses $1$ thread.
    - `build.internal.build_threads = 4` means that the K-means algorithm uses $4$ threads.
    
### External Build Parameters

To reduce the computational load on your database server during index building, refer to the [External Index Precomputation Toolkit](https://github.com/tensorchord/VectorChord/tree/main/scripts#run-external-index-precomputation-toolkit) for more information.

You can refer to [performance tuning](../usage/performance-tuning#index-build-time) for more information about the performance tuning of the index.
