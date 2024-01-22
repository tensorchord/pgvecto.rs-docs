# Indexing

Indexing is the process of building a data structure that allows for efficient search. `pgvecto.rs` supports three indexing algorithms: brute force (FLAT), IVF, and HNSW. The default algorithm is HNSW.

Assuming there is a table `items` and there is a column named `embedding` of type `vector(n)`, you can create a vector index for squared Euclidean distance with the following SQL.

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops);
```

The `vector_l2_ops` is an operator class for squared Euclidean distance. You can find the list of operator classes in the [reference](/reference/schema.html#list-of-operator-classes). Now you can now execute a KNN search using the SQL below, which utilizes the vector index for the query.

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

::: details

`pgvecto.rs` constructs the index asynchronously. When you insert new rows into the table, they will first be placed in an append-only file. The background thread will periodically merge the newly inserted row to the existing index. When a user performs any search prior to the merge process, it scans the append-only file to ensure accuracy and consistency.

:::

## Examples

There are some examples of creating indexes with different algorithms and options. See the [reference](/reference/indexing_options.html) for the full list of options.

```sql
-- HNSW algorithm, default settings.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops);

--- Or using bruteforce with PQ.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.flat]
quantization.product.ratio = "x16"
$$);

--- Or using IVFPQ algorithm.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.ivf]
quantization.product.ratio = "x16"
$$);

-- Use more threads for background building the index.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
optimizing.optimizing_threads = 16
$$);

-- Prefer smaller HNSW graph.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
segment.max_growing_segment_size = 200000
$$);
```

## Suggestions

Choosing the right indexing algorithm and options is important for the performance of the vector search. Here are some suggestions for different scenarios.

### Brute force(FLAT)

If you only perform a few searches(say 1000-10000) or you need guranteed exact results, you can use the [brute force](/reference/indexing_options.html#options-for-table-flat) algorithm.

It provides the baseline for results for the other indexes. It does not compress the vectors, but does not add overhead on top of them. It's simple and easy to use. However, it's not suitable for large datasets.

You can use the quantization to reduce the memory usage. See the [reference](/reference/indexing_options.html#options-for-table-quantization) for the full list of options. If you want to find details about the quantization in the [reference](/usage/quantization.html).

### Inverted file index(IVF)

IVF mainly uses the idea of inverted indexing to store the vectors `(id, vector)` under each cluster center. When querying a vector, it finds the nearest several centers and searches for the vectors under these centers respectively. 

Before searching, you need to train `nlist` cluster centers. And you can set `nsample` for K-Means clustering. The larger the value, the more accurate the clustering, but the longer the training time. Other options can be found in the [reference](/reference/indexing_options.html#options-for-table-ivf).

### Hierarchical navigable small world graph(HNSW)

HNSW combines the idea of [skip list](https://brilliant.org/wiki/skip-lists/) and navigable small world(NSW) graphs. Through layered format, longer edges in the highest layers (for fast search) and shorter edges in the lower layers (for accurate search). 

The search process through a NSW graph. Starting at a pre-defined entry point, the algorithm greedily traverses to connected vertices that are nearer to the query vector. The stopping condition is finding no nearer vertices in our current vertex’s friend list. If we increase [`Maximum degree of the node`](/reference/indexing_options.html#options-for-table-hnsw) minimize the probability of stopping early (and increase recall). But this increases network complexity (longer index build time, higher memory usage and longer search time). So we need to balance the average degree of vertices between recall, search speed and memory usage. The [`ef_construction`](/reference/indexing_options.html#options-for-table-hnsw) controls the nearest neighbors will be returned, increasing this value may increase the recall but also increase the building time.

Smaller `m` values are better for lower-dimensional data or when you require lower recall. Larger `m` values are useful for higher-dimensional data or when high recall is important. Increasing `ef_construction` beyond a certain point offers diminishing returns on index quality but will continue to slow down index construction.
