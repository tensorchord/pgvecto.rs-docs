# Partitioning Tuning

For large tables, the partitioning phase dominates both build time and memory consumption.

Time complexity of partitioning is $O(FC^{2}DL)$, and the memory consumption in bytes can be approximated by $4DC(F + T + 1)$,

where:
* $D$ is the vector dimension, or `build.internal.kmeans_dimension` if set.
* $F$ is `build.internal.sampling_factor`.
* $C$ is `build.internal.lists[-1]`.
* $T$ is `build.internal.build_threads`.
* $L$ is `build.internal.kmeans_iterations`.

This page introduces some tuning techniques to improve build time and memory consumption.

## Hierarchical K-means

Hierarchical K-means is an algorithm that is faster than [Lloyd's algorithm](https://en.wikipedia.org/wiki/Lloyd%27s_algorithm). When applied this algorithm, the asymptotic time complexity is reduced to $O(FC^{1.5}DL)$. As a trade-off, it has a slight negative impact on search performance and recall.

Usage:

```toml
build.internal.kmeans_algorithm.hierarchical = {}
```

## Reduce Sampling Factor

Reducing sampling factor improves build time and memory consumption linearly. As a trade-off, it has a moderate negative impact on search performance and recall.

Usage:

```toml
build.internal.sampling_factor = 64
```

## Dimensionality reduction

Dimensionality reduction uses the fast Johnson–Lindenstrauss transform, reducing the dimensionality of the vectors involved in clustering to below their original dimension, thereby improving build time and memory consumption linearly. As a trade-off, it has a slight negative impact on search performance and recall.

Usage:

```toml
build.internal.kmeans_dimension = 100
```

## Reference settings

### LAION 100M

Dataset:

* Source: https://sisap-challenges.github.io/2024/datasets/
* Metric: Inner Product
* Dimension: 768
* Number of vectors: 100,000,000
* Number of test vectors: 1,000

Test machine (AWS EC2 i7i.4xlarge):

* CPU: Intel Xeon Platinum 8559C
* Number of vCPUs: 16
* Memory: 128 GiB
* Storage: 3750 GiB NVMe SSD

```sql
CREATE INDEX ON laion USING vchordrq (embedding vector_ip_ops) WITH (options = $$
build.pin = 2
build.internal.lists = [400, 160000]
build.internal.build_threads = 16
build.internal.spherical_centroids = true
build.internal.kmeans_algorithm.hierarchical = {}
build.internal.kmeans_dimension = 100
build.internal.sampling_factor = 64
$$);
```

Result:

* Total Build Time: 18 minutes
* Peak Memory: 6 GiB
* Test Case 1
  * Parameters
    * `vchordrq.probes = '40,140'`
    * `vchordrq.epsilon = 1.4`
  * QPS @ Top10: 120
  * Recall @ Top10: 0.949

### DEEP 1B

Dataset:

* Source: https://big-ann-benchmarks.com/neurips21.html
* Metric: Euclidean
* Dimension: 96
* Number of vectors: 1,000,000,000
* Number of test vectors: 10,000

Test machine (AWS EC2 i7ie.6xlarge):

* CPU: Intel Xeon Platinum 8559C
* Number of vCPUs: 24
* Memory: 192 GiB
* Storage: 7500 GiB NVMe SSD

```sql
CREATE INDEX ON deep USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.pin = 2
residual_quantization = true
build.internal.lists = [800, 640000]
build.internal.build_threads = 24
build.internal.kmeans_algorithm.hierarchical = {}
$$);
```

Result:

* Total Build Time: 107 minutes
* Peak Memory: 64 GiB
* Test Case 1
  * Parameters
    * `vchordrq.probes = '40,250'`
  * QPS @ Top10: 68
  * Recall @ Top10: 0.951