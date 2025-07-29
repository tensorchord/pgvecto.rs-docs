# Indexing

VectorChord's index type `vchordrq` divides vectors into lists and searches only a subset of lists closest to the query vector. It provides fast build time and low memory consumption, while delivering [significantly better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than both `hnsw` and `ivfflat`.

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
> - When dealing with large tables, it will cost huge time and memory for `build.internal`. You can refer to [External Build](external-index-precomputation) to have a better experience.
> - The parameter `lists` should be configured based on the number of rows. The following table provides guidance for this selection. When searching, set `vchordrq.probes` based on the value of `lists`.

| Number of Rows $N$                     | Recommended Number of Partitions $L$ | Example `lists` |
| -------------------------------------- | ------------------------------------ | --------------- |
| $N \in [0, 10^5)$                      | N/A                                  | `[]`            |
| $N \in [10^5, 2 \times 10^6)$          | $L = \frac{N}{500}$                  | `[2000]`        |
| $N \in [2 \times 10^6, 5 \times 10^7)$ | $L \in [4 \sqrt{N}, 8 \sqrt{N}]$     | `[10000]`       |
| $N \in [5 \times 10^7, \infty)$        | $L \in [8 \sqrt{N}, 16\sqrt{N}]$     | `[80000]`       |

Then the index will be built internally, and you can perform a vector search with the index.

```sql
SET vchordrq.probes = '10';
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

## Reference

### Operator Classes

The table below shows all operator classes for `vchordrq`.

| Operator Class       | Description                                                     | Operator 1                | Operator 2               |
| -------------------- | --------------------------------------------------------------- | ------------------------- | ------------------------ |
| `vector_l2_ops`      | index works for `vector` type and Euclidean distance            | `<->(vector,vector)`      | `<<->>(vector,vector)`   |
| `vector_ip_ops`      | index works for `vector` type and negative inner product        | `<#>(vector,vector)`      | `<<#>>(vector,vector)`   |
| `vector_cosine_ops`  | index works for `vector` type and cosine distance               | `<=>(vector,vector)`      | `<<=>>(vector,vector)`   |
| `halfvec_l2_ops`     | index works for `halfvec` type and Euclidean distance           | `<->(halfvec,halfvec)`    | `<<->>(halfvec,halfvec)` |
| `halfvec_ip_ops`     | index works for `halfvec` type and negative inner product       | `<#>(halfvec,halfvec)`    | `<<#>>(halfvec,halfvec)` |
| `halfvec_cosine_ops` | index works for `halfvec` type and cosine distance              | `<=>(halfvec,halfvec)`    | `<<=>>(halfvec,halfvec)` |
| `vector_maxsim_ops`  | index works for `vector[]` type and scalable vector-similarity  | `@#(vector[],vector[])`   | N/A                      |
| `halfvec_maxsim_ops` | index works for `halfvec[]` type and scalable vector-similarity | `@#(halfvec[],halfvec[])` | N/A                      |

`<<->>`, `<<#>>`, `<<=>>` and `@#` are operators defined by VectorChord.

For more information about `<<->>`, `<<#>>`, `<<=>>`, refer to [Similarity Filter](range-query).

For more information about `@#`, refer to [Multi-Vector Retrieval](indexing-with-maxsim-operators).

The operator classes for `MaxSim` have been available only since version `0.3.0`.

### Indexing Options

#### `residual_quantization`

- Description: This index parameter determines whether residual quantization is used. If you not familiar with residual quantization, you can read this [blog](https://drscotthawley.github.io/blog/posts/2023-06-12-RVQ.html) for more information. In short, residual quantization is a technique that improves the accuracy of vector search by quantizing the residuals of the vectors.
- Type: boolean
- Default: `false`
- Example:
    - `residual_quantization = false` means that residual quantization is not used.
    - `residual_quantization = true` means that residual quantization is used.

### Internal Build Options

#### `build.internal.lists`

- Description: This index parameter determines the hierarchical structure of the vector space partitioning.
- Type: list of integers
- Default:
    - `[]` <badge type="tip" text="since v0.3.0" />
    - `[1000]` <badge type="tip" text="until v0.2.2: implicit behavior is not ideal" />
- Example:
    - `build.internal.lists = []` means that the vector space is not partitioned.
    - `build.internal.lists = [4096]` means the vector space is divided into $4096$ cells.
    - `build.internal.lists = [4096, 262144]` means the vector space is divided into $4096$ cells, and those cells are further divided into $262144$ smaller cells.
- Note: The index partitions the vector space into multiple Voronoi cells using centroids, iteratively creating a hierarchical space partition tree. Each leaf node in this tree represents a region with an associated list storing vectors in that region. During insertion, vectors are placed in lists corresponding to their appropriate leaf nodes. For queries, the index optimizes search by excluding lists whose leaf nodes are distant from the query vector, effectively pruning the search space. If the length of `lists` is $1$, the `lists` option should be no less than $4 * \sqrt{N}$, where $N$ is the number of vectors in the table.

#### `build.internal.spherical_centroids`

- Description: This index parameter determines whether to perform spherical K-means -- the centroids are L2 normalized after each iteration, you can refer to option `spherical` in [here](https://github.com/facebookresearch/faiss/wiki/Faiss-building-blocks:-clustering,-PCA,-quantization#additional-options).
- Type: boolean
- Default: `false`
- Example:
    - `build.internal.spherical_centroids = false` means that spherical k-means is not performed.
    - `build.internal.spherical_centroids = true` means that spherical k-means is performed.
- Note: Set this to `true` if your model generates embeddings that use cosine similarity as the metric.

#### `build.internal.sampling_factor` <badge type="tip" text="since v0.2.0" />

- Description: This index parameter determines the number of vectors the K-means algorithm samples per cluster. The higher this value, the slower the build, the greater the memory consumption in building, and the better search performance.
- Type: integer
- Domain: `[0, 1024]`
- Default: `256`
- Example:
    - `build.internal.sampling_factor = 256` means that the K-means algorithm samples $256 C$ vectors, where $C$ is the maximum value in `build.internal.lists`.
    - `build.internal.sampling_factor = 1024` means that the K-means algorithm samples $1024 C$ vectors, where $C$ is the maximum value in `build.internal.lists`.

#### `build.internal.kmeans_iterations` <badge type="tip" text="since v0.2.2" />

- Description: This index parameter determines the number of iterations for K-means algorithm. The higher this value, the slower the build.
- Type: integer
- Domain: `[0, 1024]`
- Default: `10`
- Example:
    - `build.internal.kmeans_iterations = 10` means that the K-means algorithm performs $10$ iterations.
    - `build.internal.kmeans_iterations = 100` means that the K-means algorithm performs $100$ iterations.

#### `build.internal.build_threads` {#build-internal-build-threads}

- Description: This index parameter determines the number of threads used by K-means algorithm. The higher this value, the faster the build, and greater load on the server in building.
- Type: integer
- Domain: `[1, 255]`
- Default: `1`
- Example:
    - `build.internal.build_threads = 1` means that the K-means algorithm uses $1$ thread.
    - `build.internal.build_threads = 4` means that the K-means algorithm uses $4$ threads.
