# Partitioning Tuning

For large tables, the partitioning phase can dominate both build time and memory consumption.

The build time of this phase is primarily driven by the cost of K-means. As the table grows, `build.internal.lists[-1]` is typically increased to match the number of rows, resulting in a larger number of centroids.

Since the computational cost of standard K-means grows with the number of centroids, partitioning very large tables can be time-consuming, and may take 1 day or longer on a typical cloud instance.

During the partitioning phase, VectorChord allocates additional memory beyond PostgreSQL shared buffers to process input vectors during partitioning. The amount of memory consumed is primarily determined by the vector dimensionality, the number of centroids, and the amount of data sampled.

This memory usage can be approximated as:

$4DC(F + T + 1)$

where:
* $D$ is the vector dimension, or `build.internal.kmeans_dimension` if set.
* $F$ is `build.internal.sampling_factor`.
* $C$ is `build.internal.lists[-1]`.
* $T$ is `build.internal.build_threads`.

The table below illustrates an extreme example of memory usage under these parameters:

| D    | C      | F    | T    | Memory estimation |
| ---- | ------ | ---- | ---- | ----------------- |
| 768  | 640000 | 256  | 24   | 514.6 GiB         |

Under such conditions, building an index is unlikely to complete within reasonable time and memory constraints on a single machine. This section therefore focuses on techniques for adapting the partitioning process to make indexing feasible at scales ranging from millions to billions of rows.

## Hierarchical K-means

To address the rapidly increasing computational cost of standard K-means as the number of centroids grows, hierarchical K-means decomposes the partitioning process into multiple levels, each operating on a smaller set of centroids.

This can substantially reduce partitioning time, but may lead to less precise cluster boundaries, affecting downstream search accuracy.

The following example shows how to enable hierarchical K-means during the partitioning phase.

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
kmeans_algorithm.hierarchical = {}
$$);
```

## K-means Dimension

Because memory consumption during the partitioning phase is driven by the dimensionality of the input vectors, reducing the vector dimension used for K-means is an effective way to lower memory usage.

VectorChord supports reducing vector dimensionality during partitioning and restoring the original dimensionality afterward. Using lower-dimensional vectors reduces memory consumption and can also speed up the partitioning phase.

However, reducing the vector dimension may produce coarser centroids, affecting index quality and downstream query accuracy, and the dimensionality restoration step can introduce additional overhead, so the overall impact on build time may vary.

If the K-means dimension `build.internal.kmeans_dimension` exceeds the original vector dimension, it is ignored.

The following example shows how to enable dimensionality reduction during the partitioning phase.

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
kmeans_dimension = 100
$$);
```

## K-means Samples

In addition to vector dimensionality, the number of vectors sampled for K-means is another key factor that influences the cost of the partitioning phase.

VectorChord applies sampling before K-means when the number of input vectors exceeds `build.internal.sampling_factor × build.internal.lists[-1]`.

Lower values of `build.internal.sampling_factor` reduce the number of vectors used for K-means, resulting in faster indexing and lower memory usage. The default value is 256, and values are typically not set lower than 64 in practice, as too few samples can lead to a noticeable degradation in query recall.

The following example shows how to reduce the sampling factor during the partitioning phase.

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
sampling_factor = 64
$$);
```

## Large-scale Indexing Results

Prior to VectorChord 1.0.0, index construction for extremely large datasets typically relied on [external build](external-index-precomputation.md) on GPU instances to handle the computational and memory demands.

By combining the techniques described above, it becomes possible to build indexes for very large datasets on a single machine. The following examples show index configurations used in this setting.

For dataset LAION with 100 million rows:

```sql
CREATE INDEX ON laion USING vchordrq (embedding vector_ip_ops) WITH (options = $$
build.pin = 2
[build.internal]
lists = [400, 160000]
build_threads = 16
spherical_centroids = true
kmeans_algorithm.hierarchical = {}
kmeans_dimension = 100
sampling_factor = 64
$$);
```

For dataset DEEP with 1 billion rows:

```sql
CREATE INDEX ON deep USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
kmeans_algorithm.hierarchical = {}
$$);

```

The table below summarizes representative benchmark results obtained with these configurations.

| Target                          | [LAION](https://blog.vectorchord.ai/how-we-made-100m-vector-indexing-in-20-minutes-possible-on-postgresql) | [DEEP](https://blog.vectorchord.ai/scaling-vector-search-to-1-billion-on-postgresql) |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Rows                            | 100,000,000                                                  | 1,000,000,000                                                |
| Dimension                       | 768                                                          | 96                                                           |
| Instance Type                   | Amazon EC2 i7i.8xlarge                                       | AWS  EC2 i7ie.6xlarge                                        |
| Hierarchical K-means            | Enabled                                                      | Enabled                                                      |
| build.internal.kmeans_dimension | 100                                                          | Not set                                                      |
| build.internal.sampling_factor  | 64                                                           | Not set                                                      |
| Build Time                      | 20 minutes                                                   | 107 minutes                                                  |
| Peak Memory                     | 6 GB                                                         | 64 GB                                                        |
| QPS@Top10                       | 123                                                          | 68                                                           |
| Recall@Top10                    | 94.9%                                                        | 95.1%                                                        |