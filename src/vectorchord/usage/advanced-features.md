# Advanced Features

## Indexing Prewarm

For disk-first indexing, RaBitQ(vchordrq) is loaded from disk for the first query, 
and then cached in memory if `shared_buffer` is sufficient, resulting in a significant cold-start slowdown.

To improve performance for the first query, you can try the following SQL that preloads the index into memory.

```SQL
-- vchordrq_prewarm(index_name) to prewarm the index into the shared buffer
SELECT vchordrq_prewarm('gist_train_embedding_idx')
```

The indexing of each specific dimension in VectorChord requires preprocessing, which can increase the latency of the first query. This can be mitigated by modifying GUC `vchordrq.prewarm_dim` to perform the preprocessing ahead of time during PostgreSQL cluster startup.

```SQL
-- Add your vector dimensions to the `prewarm_dim` list to reduce latency.
-- If this is not configured, the first query will have higher latency as the matrix is generated on demand.
-- Default value: '64,128,256,384,512,768,1024,1536'
-- Note: This setting requires a database restart to take effect.
ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128,256,384,512,768,1024,1536';
```

## Indexing Progress

You can check the indexing progress by querying the `pg_stat_progress_create_index` view.

```SQL
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%" FROM pg_stat_progress_create_index;
```

## External Index Precomputation

Unlike pure SQL, external index precomputation performs clustering externally before inserting centroids into a PostgreSQL table. While this process may be more complex, it significantly speeds up indexing for larger datasets (>5M). We showed some benchmarks in the [blog post](https://blog.pgvecto.rs/vectorchord-store-400k-vectors-for-1-in-postgresql). It takes around 3 minutes to build an index for 1M vectors, 16x faster than standard indexing in pgvector.

To get started, you need to do a clustering of vectors using `faiss`, `scikit-learn` or any other clustering library.

The centroids should be preset in a table of any name with 3 columns:
- `id(integer)`: id of each centroid, should be unique
- `parent(integer, nullable)`: parent id of each centroid, could be `NULL` for normal clustering
- `vector(vector)`: representation of each centroid, `vector` type

And example could be like this:

```sql
-- Create table of centroids
CREATE TABLE public.centroids (id integer NOT NULL UNIQUE, parent integer, vector vector(768));
-- Insert centroids into it
INSERT INTO public.centroids (id, parent, vector) VALUES (1, NULL, '{0.1, 0.2, 0.3, ..., 0.768}');
INSERT INTO public.centroids (id, parent, vector) VALUES (2, NULL, '{0.4, 0.5, 0.6, ..., 0.768}');
INSERT INTO public.centroids (id, parent, vector) VALUES (3, NULL, '{0.7, 0.8, 0.9, ..., 0.768}');
-- ...

-- Create index using the centroid table
CREATE INDEX ON gist_train USING vchordrq (embedding vector_l2_ops) WITH (options = $$
[build.external]
table = 'public.centroids'
$$);
```

To simplify the workflow, we provide end-to-end scripts for external index pre-computation, see [Run External Index Precomputation Toolkit](https://github.com/tensorchord/VectorChord/tree/main/scripts#run-external-index-precomputation-toolkit).

## Capacity-optimized Index

The default behavior of Vectorchord is `performance-optimized`, 
which uses more disk space but has a better latency:
- About `80G` for `5M` 768 dim vectors
- About `800G` for `100M` 768 dim vectors

Although it is acceptable for such large data, it could be switched to `capacity-optimized` index and save about **50%** of your disk space. 

For `capacity-optimized` index, just enable the `rerank_in_table` option when creating the index:
```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
rerank_in_table = true
[build.internal]
lists = []
$$);
```

> [!CAUTION]
> Compared to the `performance-optimized` index, the `capacity-optimized` index will have a **30-50%** increase in latency and QPS loss at query.
