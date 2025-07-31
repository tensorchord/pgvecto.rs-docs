# Indexing

VectorChord's index type `vchordrq` divides vectors into lists and searches only a subset of lists closest to the query vector. It provides fast build time and low memory consumption, while delivering [significantly better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than both `hnsw` and `ivfflat`.

Let's start by creating a table named `items` with an `embedding` column of type `vector(n)`, and then populate it with sample data.

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
INSERT INTO items (embedding) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
```

To create a `vchordrq` index, you can use the following SQL.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops);
```

After the index is built, you can perform a vector search using it to retrieve the $10$ nearest neighbors to a vector.

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

You can also add filters to vector search queries as needed.

```sql
SELECT * FROM items WHERE id % 7 <> 0 ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

## Tuning

When there are less than $100,000$ rows in the table, you usually don't need to set parameters for search and query.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

However, as the number of rows grows, partitioning becomes necessary and can be configured using index options. `options` are specified using a [TOML: Tom's Obvious Minimal Language](https://toml.io/) string. You can refer to [#Index Options](#indexing-options) for more information.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
[build.internal]
lists = [1000]
$$);

SET vchordrq.probes TO '10';
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

The parameter `lists` should be tuned based on the number of rows. The following table provides guidelines for choosing an appropriate value. When querying, choose `vchordrq.probes` accordingly.

| Number of Rows $N$                     | Recommended Number of Partitions $L$ | Example `lists` |
| -------------------------------------- | ------------------------------------ | --------------- |
| $N \in [0, 10^5)$                      | N/A                                  | `[]`            |
| $N \in [10^5, 2 \times 10^6)$          | $L = \frac{N}{500}$                  | `[2000]`        |
| $N \in [2 \times 10^6, 5 \times 10^7)$ | $L \in [4 \sqrt{N}, 8 \sqrt{N}]$     | `[10000]`       |
| $N \in [5 \times 10^7, \infty)$        | $L \in [8 \sqrt{N}, 16\sqrt{N}]$     | `[80000]`       |

The process of building an index involves two steps: partitioning the vector space first, and then inserting rows into the index. The first step, partitioning the vector space, can be sped up using multiple threads.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
[build.internal]
lists = [1000]
build_threads = 8
$$);

SET vchordrq.probes TO '10';
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 10;
```

The second step, inserting rows, can be parallelized using multiple processes. Refer to [PostgreSQL Tuning](performance-tuning.md#indexing).

For most datasets using cosine similarity, enabling `residual_quantization` and `build.internal.spherical_centroids` improves both QPS and recall.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [1000]
spherical_centroids = true
build_threads = 8
$$);

SET vchordrq.probes TO '10';
SELECT * FROM items ORDER BY embedding <=> '[3,1,2]' LIMIT 10;
```

For large tables, the `build.internal` process costs huge time and memory. You can refer to [External Build](external-index-precomputation) to have a better experience.

For large tables, you may opt to use more shared memory to accelerate the process by setting `build.pin` to `true`.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
build.pin = true
[build.internal]
lists = [1000]
spherical_centroids = true
build_threads = 8
$$);
```

## Reference

### Operator Classes <badge type="info" text="vchordrq" /> {#operator-classes}

The following table lists all available operator classes supported by `vchordrq`.

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

`<->`, `<#>` and `<=>` are operators defined by pgvector.

| Name  | Description                |
| ----- | -------------------------- |
| `<->` | squared Euclidean distance |
| `<#>` | negative dot product       |
| `<=>` | cosine distance            |

`<<->>`, `<<#>>`, `<<=>>` and `@#` are operators defined by VectorChord.

For more information about `<<->>`, `<<#>>`, `<<=>>`, refer to [Similarity Filter](range-query).

For more information about `@#`, refer to [Multi-Vector Retrieval](indexing-with-maxsim-operators).

The operator classes for `MaxSim` are available since version `0.3.0`.

### Indexing Options <badge type="info" text="vchordrq" /> {#indexing-options}

#### `residual_quantization`

- Description: This index parameter determines whether residual quantization is used. If you not familiar with residual quantization, you can read this [blog](https://drscotthawley.github.io/blog/posts/2023-06-12-RVQ.html) for more information. In short, residual quantization is a technique that improves the accuracy of vector search by quantizing the residuals of the vectors.
- Type: boolean
- Default: `false`
- Example:
    - `residual_quantization = false` means that residual quantization is not used.
    - `residual_quantization = true` means that residual quantization is used.

#### `build.pin` <badge type="tip" text="since v0.2.1" />

- Description: This index parameter determines whether shared memory is used for indexing. For large tables, you can choose to enable this option to speed up the build process.
- Type: boolean
- Default: `false`
- Example:
    - `build.pin = false` means that shared memory is not used.
    - `build.pin = true` means that shared memory is used.

### Internal Build Options <badge type="info" text="vchordrq" />

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
- Note: The index partitions the vector space into multiple Voronoi cells based on centroids, iteratively creating a hierarchical space partition tree. Each leaf node in this tree represents a region with an associated list storing vectors in that region. During insertion, vectors are placed in lists corresponding to their appropriate leaf nodes. For queries, the index optimizes search by excluding lists whose leaf nodes are distant from the query vector, effectively pruning the search space. If the length of `lists` is $1$, the `lists` option should be no less than $4 * \sqrt{N}$, where $N$ is the number of vectors in the table.

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

#### `build.internal.build_threads`

- Description: This index parameter determines the number of threads used by K-means algorithm. The higher this value, the faster the build, and greater load on the server in building.
- Type: integer
- Domain: `[1, 255]`
- Default: `1`
- Example:
    - `build.internal.build_threads = 1` means that the K-means algorithm uses $1$ thread.
    - `build.internal.build_threads = 4` means that the K-means algorithm uses $4$ threads.

### Search Parameters <badge type="info" text="vchordrq" />

#### `vchordrq.probes`

- Description: This GUC parameter `vchordrq.probes` controls how the vector space assists in query pruning. The more probes, the more accurate the search, but also the slower it is.
- Type: list of integers
- Default:
    - ` ` <badge type="tip" text="since v0.3.0" />
    - `10` <badge type="tip" text="until v0.2.2: the default value was 10 before `lists` defaulted to empty" />
- Example:
    - `SET vchordrq.probes = 1` means that only one probe is used.
    - `SET vchordrq.probes = 10` means that ten probes are used.
- Note: The default value is an empty list. The length of this option must match the length of `lists`. 
    - If `lists = []`, then probes must be ` `.
    - If `lists = [11, 22]`, then probes can be `2,4` or `4,8`. It must not be incorrectly shaped, for example, ` `, `3`, `7,8,9`, `5,5,5,5`.

#### `vchordrq.epsilon`

- Description: Even after pruning, the number of retrieved vectors remains substantial. The index employs the RaBitQ algorithm to quantize vectors into bit vectors, which require just $\frac{1}{32}$ the memory of single-precision floating-point vectors. Most computations are integer-based, leading to faster processing. Unlike conventional quantization algorithms, RaBitQ estimates not only distances but also their lower bounds. The index computes the lower bound for each vector and dynamically adjusts the number of vectors needing recalculated distances, based on the query count, thus balancing performance and accuracy. The GUC parameter `vchordrq.epsilon` controls the conservativeness of the lower bounds of distances. The higher the value, the higher the accuracy, but the worse the performance. The default value tends to favor higher accuracy than needed for most use cases, so you can try lowering this parameter to achieve better performance.
- Type: float
- Default: `1.9`
- Domain: `[0.0, 4.0]`
- Example:
    - `SET vchordrq.epsilon = 0.1` indicates you are using a very optimistic lower bound estimation. You set it this way because your dataset is not sensitive to the lower bound estimation, for the precision you need.
    - `SET vchordrq.epsilon = 4.0` indicates you are using a very pessimistic lower bound estimation. You set it this way because your dataset is not very sensitive to the lower bound estimation, for the precision you need.

#### `vchordrq.prewarm_dim` <badge type="danger" text="deprecated in v0.4.0" />	

- Description: The `vchordrq.prewarm_dim` GUC parameter is used to precompute the RaBitQ projection matrix for the specified dimensions. This can help to reduce the latency of the first query after the PostgreSQL cluster is started.
- Type: list of integers
- Default: `64,128,256,384,512,768,1024,1536`
- Example:
    - `ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128'` means that the projection matrix will be precomputed for dimensions 64 and 128.
- Note:
    - This setting requires a database restart to take effect.
    - Since `v0.4.0`, a new algorithm made this option obsolete.
