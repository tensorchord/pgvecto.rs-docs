# Indexing

Similar to [ivfflat](https://github.com/pgvector/pgvector#ivfflat), the index type of VectorChord, RaBitQ(vchordrq) also divides vectors into lists, and then searches a subset of those lists that are closest to the query vector. It inherits the advantages of `ivfflat`, such as fast build times and less memory usage, but has [much better performance](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql#heading-ivf-vs-hnsw) than hnsw and ivfflat.

The RaBitQ(vchordrq) index is supported on some pgvector types and metrics:

|                         | vector | halfvec | bit(n) | sparsevec |
| ----------------------- | ------ | ------- | ------ | --------- |
| L2 distance / `<->`     | ✅      | ✅       | 🆖      | ❌         |
| inner product / `<#>`   | ✅      | ✅       | 🆖      | ❌         |
| cosine distance / `<=>` | ✅      | ✅       | 🆖      | ❌         |
| L1 distance / `<+>`     | ❌      | ❌       | 🆖      | ❌         |
| Hamming distance/ `<~>` | 🆖      | 🆖       | ❌      | 🆖         |
| Jaccard distance/ `<%>` | 🆖      | 🆖       | ❌      | 🆖         |

Where:
- ✅ means supported by pgvector and VectorChord
- ❌ means supported by pgvector but not by VectorChord
- 🆖 means not planned by pgvector and VectorChord
- 🔜 means supported by pgvector now and will be supported by VectorChord soon

To create the VectorChord RaBitQ(vchordrq) index, you can use the following SQL.

L2 distance
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
> - Set `residual_quantization` to `true` and `spherical_centroids` to `false` for L2 distance embeddings
> - Use `halfvec_l2_ops` for `halfvec`
> - The recommended `lists` could be rows / 1000 for up to 1M rows and 4 * sqrt(rows) for over 1M rows

Inner product
```sql
CREATE INDEX ON items USING vchordrq (embedding vector_ip_ops) WITH (options = $$
residual_quantization = false
[build.internal]
lists = [1000]
spherical_centroids = true
$$);
```

Cosine distance
```sql
CREATE INDEX ON items USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
residual_quantization = false
[build.internal]
lists = [1000]
spherical_centroids = true
$$);
```

> [!NOTE]
> - Set `residual_quantization` to `false` and `spherical_centroids` to `true` for cosine similarity embeddings
> - Use `halfvec_cosine_ops`/`halfvec_ip_ops` for `halfvec`

To construct an index for vectors, first create a table named `items` with a column named `embedding` of type `vector(n)`. Then, populate the table with generated data.

```sql
CREATE TABLE items (embedding vector(3));
INSERT INTO items (embedding) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
```

You can create a vector index for squared Euclidean distance with the following SQL.

```sql
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [4096]
spherical_centroids = false
$$);
```

The `[build.internal]` section contains the following options:

- `lists`: The number of lists in the inverted file.
- `spherical_centroids`: Whether to use spherical centroids.

The index will be built internally.
