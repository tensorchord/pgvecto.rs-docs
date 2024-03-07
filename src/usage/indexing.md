# Indexing

Indexing is the process of building a data structure that allows for efficient search. `pgvecto.rs` supports three indexing algorithms: brute force (flat), IVF, and HNSW. The default algorithm is HNSW.

Assuming there is a table `items` and there is a column named `embedding` of type `vector(n)`, you can create a vector index for squared Euclidean distance with the following SQL.

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops);
```

The `vector_l2_ops` operator class calculates squared Euclidean distance. Refer to the [documentation](/reference/schema.html#list-of-operator-classes) for a list of operator classes.

To switch the indexing algorithm from the default HNSW to IVF, execute the SQL command below. For additional examples of usage, refer to the [documentation](#examples).

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.ivf]
$$);
```

You can now perform a KNN search with the following SQL, leveraging the vector index for your query.

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,2,1]' LIMIT 5;
```

::: details

`pgvecto.rs` constructs the index asynchronously. When you insert new rows into the table, they will first be placed in an append-only file. The background thread will periodically merge the newly inserted row to the existing index. When a user performs any search prior to the merge process, it scans the append-only file to ensure accuracy and consistency.

:::

## Examples

Here are some examples of how to create indexes using various algorithms and settings. For a complete list of options, please consult the [reference guide](/reference/indexing_options.html).

```sql
-- HNSW algorithm, default settings.

CREATE INDEX ON items USING vectors (embedding vector_l2_ops);

-- Use FP16 vector type for optimizing data storage.

CREATE TABLE items (embedding vecf16(3));
CREATE INDEX ON items USING vectors (embedding vecf16_l2_ops)

--- Or using brute force with product quantization (PQ).

CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.flat]
quantization.product.ratio = "x16"
$$);

-- Or using brute force with scalar quantization (SQ).
CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = "[indexing.hnsw.quantization.scalar]");

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

Selecting the appropriate indexing algorithm and settings is crucial for vector search performance. Below are recommendations tailored to various use cases.

### Brute force (flat)
If you're conducting a limited number of searches (between 1,000 and 10,000) or require precise results, the [brute force](/reference/indexing_options.html#options-for-table-flat) algorithm is a viable option.

This algorithm sets the standard for other indexing methods. It retains vectors in their original form without compression and avoids additional overhead. While straightforward and user-friendly, it's not ideal for processing large datasets.

In addition, you can use quantization to reduce memory usage. For a complete list of all options, please refer to the [documentation](/reference/indexing_options.html#options-for-table-quantization). Detailed information about quantization can also be found [there](/usage/quantization.html).

### Inverted file index (IVF)

IVF mainly uses the idea of inverted indexing to store the vectors `(id, vector)` under each cluster center. When querying a vector, it finds the nearest several centers and searches for the vectors under these centers respectively.

Before you begin your search, it's necessary to train nlist cluster centers. You also have the option to set nsample for K-Means clustering; a higher value yields more precise clusters but increases training time. For additional settings, please consult the reference guide.

Before searching, train `nlist` cluster centers using K-Means clustering with `nsample` points. A higher value yields more precise clustering but requires longer training time. For additional settings, please consult the [reference guide](/reference/indexing_options.html#options-for-table-ivf).

### Hierarchical navigable small world graph (HNSW)

HNSW merges the concepts of [skip list](https://en.wikipedia.org/wiki/Skip_list) with navigable small world (NSW) graphs, employing a hierarchical structure that features longer edges on higher layers for rapid searching and shorter edges on lower layers to enhance search precision. 

#### Navigable small world

Navigable Small World operate on the premise that each node is accessible from any other through a minimal number of "hops." Once an entry point is chosen—be it random, heuristic-based, or algorithmically determined—the surrounding nodes are examined to identify if they're nearer than the current one. The search progresses to the nearest neighbor and continues until no closer nodes can be found.

When constructing the graph, the `m` parameter determines how many connections a new node will establish with its nearest neighbors. A higher `m` value results in a denser and more interconnected graph but also increases memory usage and slows down insertion times. During node insertion, the algorithm identifies the closest `m` nodes to create two-way links with them. 

The search process navigates through an NSW graph, beginning at a pre-defined entry point. The algorithm proceeds by greedily moving to adjacent vertices closer to the query vector. The process stops once it finds no closer neighbors in the current vertex's adjacency list.

A limitation of the NSW search is that it opts for the seemingly shortest path to the nearest node, disregarding the graph's overall structure. This "greedy search" approach can result in getting stuck at a local optimum, an issue often referred to as "early stopping."

#### Skip list

Skip lists are constructed using a probabilistic approach, where nodes become less likely to appear as you move up the layers, resulting in fewer nodes at higher levels. To search for a node, the algorithm starts at the top layer's "head" and moves to the next node that is greater than or equal to the target. If the node isn't found, it descends to a lower (more fine-grained) layer and continues this pattern until it locates either the desired node or its nearest neighbors.


#### HNSW 

Constructing this multi-layered graph begins with a foundational layer that encapsulates the entire dataset. Moving up the hierarchy, each successive layer provides a streamlined summary of its predecessor, featuring fewer nodes and functioning as fast tracks for making broader leaps within the graph.

Smaller [`m`](/reference/indexing_options.html#options-for-table-hnsw)) values are better for lower-dimensional data or when you require lower recall. Larger `m` values are useful for higher-dimensional data or when high recall is important. 

The [`ef_construction`](/reference/indexing_options.html#options-for-table-hnsw) parameter determines the dynamic candidate list size when adding new nodes; increasing this value may enhance recall but could extend index construction time.

The HNSW index is resource-intensive, requiring additional RAM and an adjustment to the `maintenance_work_mem` setting for larger datasets. If you're seeking performance that's markedly faster than IVF, with a high recall rate and scalability that matches dataset size, HNSW is an excellent option.
