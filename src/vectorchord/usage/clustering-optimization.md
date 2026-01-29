# Clustering Optimization

For small tables, setting `build.pin` to `2` is often sufficient to achieve acceptable build performance. However, as the number of rows grows, the partitioning phase (K-means clustering) can become both time- and memory-intensive.

The following example shows a baseline index configuration for a table with approximately 1 billion rows:

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
$$);
```

This section describes several techniques to reduce build time and memory consumption when indexing large tables.

## Optimize: Build time

For very large tables, you can enable hierarchical clustering to significantly reduce build time, at the cost of a small reduction in recall.

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

## Optimize: Memory usage

During the partitioning phase, additional memory is allocated for K-means clustering, beyond PostgreSQL shared buffers. For very large tables, this extra memory consumption can become significant and may exceed physical memory limits.

VectorChord logs an estimated memory usage message at the [INFO](https://www.postgresql.org/docs/current/runtime-config-logging.html#RUNTIME-CONFIG-SEVERITY-LEVELS) level when clustering starts. An example log entry is shown below:

```
INFO:  clustering: estimated memory usage is 1.49 GiB
```

If the estimated value exceeds your available memory or operational constraints, the options described in this section can help reduce memory consumption during index building.

The memory usage is approximately $4DC(F + T + 1)$ where:

* $D$: the dimension of vectors, or `build.internal.kmeans_dimension` if set
* $F$: `build.internal.sampling_factor`.
* $C$: `build.internal.lists[-1]`.
* $T$: `build.internal.build_threads`

Reducing $D$ or $F$ is often an effective way to lower memory consumption. The table below illustrates an extreme example:

| D    | C      | F    | T    | Memory estimation |
| ---- | ------ | ---- | ---- | ----------------- |
| 768  | 640000 | 256  | 24   | 514.6 GiB         |
| 128  | 640000 | 64   | 24   | 27.2 GiB          |

The following example shows how to reduce memory usage by lowering the K-means dimension and sampling factor:

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
[build.internal]
build_threads = 24
lists = [800, 640000]
kmeans_algorithm.hierarchical = {}
kmeans_dimension = 100
sampling_factor = 64
$$);
```

---

With these optimization features, it becomes feasible to build indexes with up to one billion vectors on a single machine. The table below summarizes representative results from our benchmarks.

| Target                          | [LAION](https://blog.vectorchord.ai/how-we-made-100m-vector-indexing-in-20-minutes-possible-on-postgresql) | [DEEP](https://blog.vectorchord.ai/scaling-vector-search-to-1-billion-on-postgresql) |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Rows                            | 100,000,000                                                  | 1,000,000,000                                                |
| Dimension                       | 768                                                          | 96                                                           |
| Instance Type                   | Amazon i7i.8xlarge                                           | AWS i7ie.6xlarge                                             |
| Hierarchical K-means            | Enabled                                                      | Enabled                                                      |
| build.internal.kmeans_dimension | 100                                                          | Not set                                                      |
| build.internal.sampling_factor  | 64                                                           | 256 (default)                                                |
| Build Time                      | 20 minutes                                                   | 107 minutes                                                  |
| Peak Clustering memory          | 6 GB                                                         | 64 GB                                                        |

You can also refer to the [External Build](external-index-precomputation) to offload the clustering to other machines.