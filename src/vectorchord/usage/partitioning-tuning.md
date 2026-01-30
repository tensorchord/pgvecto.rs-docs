# Partitioning Tuning

For large tables, the partitioning phase can dominate both build time and memory consumption.

The following example shows an index configuration we used for a table with 1 billion rows.

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
$$);
```

At this scale, building an index with this configuration is unlikely to complete within reasonable time and memory constraints on a single machine. This section describes several options for adapting the process to enable indexing from millions up to billions of rows under such constraints.

## Hierarchical K-means

Standard K-means becomes increasingly expensive as the number of centroids grows. Hierarchical K-means mitigates this cost by decomposing the whole process into multiple levels, where each level performs K-means over a smaller number of centroids.

Hierarchical K-means can substantially reduce time of the partitioning. However, it may introduce less precise boundaries, which can affect downstream search accuracy.

The following example shows how to enable Hierarchical K-means during the partitioning phase:

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

During the partitioning phase, additional memory is allocated for VectorChord beyond PostgreSQL shared buffers. This memory is used to store the input vectors for K-means.

VectorChord supports reducing the dimensionality of vectors during K-means and restoring the original dimensionality afterward. Using lower-dimensional vectors reduces memory consumption and can speed up the K-means.

However, dimensionality reduction may also reduce K-means quality and query recall. In addition, the dimensionality restoration step introduces extra overhead, so the overall impact on build time may vary.

If the K-means dimension `build.internal.kmeans_dimension` exceeds the original vector dimension, it is ignored.

The following example shows how to enable dimensionality reduction during the partitioning phase:

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

VectorChord applies sampling before K-means when the number of input vectors exceeds `build.internal.sampling_factor × build.internal.lists[-1]`.

Lower values of `build.internal.sampling_factor` reduce the number of vectors used for K-means, resulting in faster K-means and lower memory usage. The default value is 256, and in practice values are typically not set lower than 64, as too few samples can lead to a noticeable degradation in query recall.

The following example shows how to reduce the sampling factor during the partitioning phase:

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

## Additional Notes

The memory usage during the partitioning phase can be approximated as:

$4DC(F + T + 1)$

where:
* $D$ is the vector dimension, or `build.internal.kmeans_dimension` if set.
* $F$ is `build.internal.sampling_factor`.
* $C$ is `build.internal.lists[-1]`.
* $T$ is `build.internal.build_threads`.

In practice, reducing $D$ or $F$ is often the effective way to lower memory consumption. The table below illustrates an extreme example:

| D    | C      | F    | T    | Memory estimation |
| ---- | ------ | ---- | ---- | ----------------- |
| 768  | 640000 | 256  | 24   | 514.6 GiB         |
| 128  | 640000 | 64   | 24   | 27.2 GiB          |

With these features, it becomes feasible to build indexes with up to one billion vectors on a single machine. The table below summarizes representative benchmark configurations and results.

| Target                          | [LAION](https://blog.vectorchord.ai/how-we-made-100m-vector-indexing-in-20-minutes-possible-on-postgresql) | [DEEP](https://blog.vectorchord.ai/scaling-vector-search-to-1-billion-on-postgresql) |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Rows                            | 100,000,000                                                  | 1,000,000,000                                                |
| Dimension                       | 768                                                          | 96                                                           |
| Instance Type                   | Amazon EC2 i7i.8xlarge                                       | AWS  EC2 i7ie.6xlarge                                        |
| Hierarchical K-means            | Enabled                                                      | Enabled                                                      |
| build.internal.kmeans_dimension | 100                                                          | Not set                                                      |
| build.internal.sampling_factor  | 64                                                           | Not set                                                      |
| Build Time                      | 20 minutes                                                   | 107 minutes                                                  |
| Peak memory                     | 6 GB                                                         | 64 GB                                                        |