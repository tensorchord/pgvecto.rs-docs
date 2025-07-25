# External Index Precomputation

Unlike pure SQL, external index precomputation performs clustering externally before inserting centroids into a PostgreSQL table. While this process may be more complex, it significantly speeds up indexing for larger datasets (>5M). We showed some benchmarks in the [blog post](https://blog.pgvecto.rs/vectorchord-store-400k-vectors-for-1-in-postgresql). It takes around 3 minutes to build an index for 1M vectors, 16x faster than standard indexing in pgvector.

To get started, you need to do a clustering of vectors using:
- [faiss](https://github.com/facebookresearch/faiss)
- [scikit-learn](https://github.com/scikit-learn/scikit-learn)
- [fastkmeans](https://github.com/AnswerDotAI/fastkmeans)
- or any other clustering library

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

To simplify the workflow, we provide end-to-end scripts for external index pre-computation, refer to [Run External Index Precomputation Toolkit](https://github.com/tensorchord/VectorChord/tree/main/scripts#run-external-index-precomputation-toolkit).
