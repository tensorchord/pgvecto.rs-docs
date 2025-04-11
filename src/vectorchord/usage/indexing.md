# Indexing

Similar to [ivfflat](https://github.com/pgvector/pgvector#ivfflat), the index type of VectorChord, RaBitQ(vchordrq) also divides vectors into lists, and then searches a subset of those lists that are closest to the query vector. It inherits the advantages of `ivfflat`, such as fast build times and less memory usage, but has [much better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than hnsw and ivfflat.

To construct an index for vectors, first create a table named `items` with a column named `embedding` of type `vector(n)`. Then, populate the table with generated data.

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
spherical_centroids = false
$$);
```

> [!NOTE]
> - `options` are specified using a [TOML: Tom's Obvious Minimal Language](https://toml.io/) string.
> - The recommended `lists` could be rows / 1000 for up to 1M rows and 4 * sqrt(rows) for over 1M rows

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

## Options

### Build Parameter `build.internal.lists` and GUC Parameter `vchordrq.probes`

The index divides the vector space into multiple Voronoi cells with multiple centroids, repeating this process until a space partition tree is constructed. The tree partitions the space into multiple regions, and each leaf node is associated with a list that stores the vectors within that region. When a vector is inserted, the index finds the corresponding leaf node and inserts the vector into its list. When a vector is searched, the index excludes lists whose corresponding leaf nodes are far from the vector, effectively pruning the search space.

The index parameter `build.internal.lists` controls the shape of the tree that the vector space is divided into, while the GUC parameter `vchordrq.probes` controls how the vector space assists in query pruning.

* `build.internal.lists = []` means that the vector space is not partitioned. `vchordrq.probes = ''` means no pruning is performed. It's also default of these two values.
* `build.internal.lists = [4096]` means the vector space is divided into $4096$ cells. vchordrq.probes = '64' means only $64$ cells out of the $4096$ are searched. So vectors within lists of those $64$ cells are searched.
* `build.internal.lists = [4096, 262144]` means the vector space is divided into $4096$ cells, and those cells are further divided into $262144$ smaller cells. `vchordrq.probes = '64, 4096'` means that within children of the root, only $64$ cells out of the $4096$ are searched, and within grandchildren of the root, only $4096$ cells out of the $262144$ are searched. So vectors within lists of those $4096$ cells are searched.

### Other Build Parameters

In order to partition the vector space into appropriate cells, the index uses K-means clustering during construction. Read [Index Internal Build](./performance-tuning.md#index-internal-build) for more information. In simple terms,

* set `build.internal.spherical_centroids` to `false` if your model generates embeddings where the metric is cosine similarity.
* set `residual_quantization` to `true` if your model generates embeddings where the metric is Euclidean distance.

This process can be performed outside the database, reducing the load on the database server. Read [Run External Index Precomputation Toolkit](https://github.com/tensorchord/VectorChord/tree/main/scripts#run-external-index-precomputation-toolkit) for more information.

### GUC Parameter `vchordrq.epsilon`

Even after pruning, the number of retrieved vectors remains large. The index uses the RaBitQ algorithm to quantize vectors into bit vectors, which occupy only $\frac{1}{32}$ of the memory compared to single-precision floating-point vectors. Since bit vectors involve almost no floating-point operations, most of the relevant computations are integer-based, resulting in faster computation. Unlike other quantization algorithms, RaBitQ not only estimates distances but also estimates the lower bounds of these distances. The index calculates the lower bound for each vector and adaptively determines how many vectors need to have their distances recalculated based on the number of query vectors, achieving both great performance and great accuracy.

The GUC parameter `vchordrq.epsilon` controls the conservativeness of the lower bounds of distances. The higher the value, the higher the accuracy, but the worse the performance. The default value is `1.9`. The acceptable range is from `0` to `4`. The default value provides unnecessarily high accuracy for most indexes, so you can try lowering this parameter to achieve better performance.
