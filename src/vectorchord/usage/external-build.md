# External Build

In addition to using the methods in [Partitioning Tuning](partitioning-tuning) to achieve shorter build time and lower memory consumption at the cost of QPS and recall, you can also choose to run the partitioning phase offline on other machines or on GPUs. This feature is not supported by `vchordg`, since it does not have a partitioning phase.

Assume the table is `t` and the column to be indexed is `val`.

```sql
CREATE TABLE t (val vector(3));
```

Specifically, you need to sample the column for which the index will be built.

```sql
CREATE EXTENSION IF NOT EXISTS tsm_system_rows;
SELECT val FROM t TABLESAMPLE SYSTEM_ROWS(1000);
```

Based on these samples, you can partition the vector space into Voronoi cells. After that, you will create a table and insert your partitions.

```sql
CREATE TABLE public.t_build (id INTEGER NOT NULL UNIQUE, parent INTEGER, vector vector NOT NULL);
INSERT INTO public.t_build (id, parent, vector) VALUES (0, NULL, '{0.1, 0.2, 0.3}');
INSERT INTO public.t_build (id, parent, vector) VALUES (1, 0, '{0.1, 0.2, 0.3}');
INSERT INTO public.t_build (id, parent, vector) VALUES (2, 0, '{0.4, 0.5, 0.6}');
INSERT INTO public.t_build (id, parent, vector) VALUES (3, 0, '{0.7, 0.8, 0.9}');
```

The index can be created using the following syntax.

```sql
CREATE INDEX ON t USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.external.table = 'public.t_build'
$$);
```

## Format

The table that stores the partition information must strictly follow the following schema:

- The first column must be `id`. Its type is `integer`. It must not be null. It must be unique.
- The second column must be `parent`. Its type is `integer`. It could not be null.
- The third column must be `vector`. Its type is `vector`. It must not be null. `halfvec` or other types are not supported yet.

Logically, this forms a tree. The distance from the root to each leaf must be the same.

If any of the above properties are not satisfied, an error will be reported.

## Partitioning

To get started, here is a minimal code example for performing partitioning using [faiss](https://github.com/facebookresearch/faiss).

```python
from typing import List
from faiss import Kmeans
import numpy

def partition(
    samples: List[numpy.Array[float]], lists: List[int]
) -> List[numpy.Array[float]]:
    dim = dataset.shape[1]
    results = []
    for i in range(len(lists) + 1):
        kmeans = Kmeans(
            dim,
            lists[len(lists) - 1 - i] if len(lists) - 1 - i >= 0 else 1,
            gpu=False,
            verbose=True,
            niter=10,
            seed=42,
            spherical=False,
        )
        kmeans.train(samples)
        results.push(kmeans.centroids)
        samples = kmeans.centroids
    return results
```

This computes the generators of all Voronoi cells across different levels. The parent-child relationships in the tree are determined by computing the shortest distances, but the details are omitted here. Any algorithm capable of generating multi-level Voronoi cells can be used, such as spherical K-means, balanced K-means or GPU K-means.
