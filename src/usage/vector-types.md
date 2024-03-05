# Vector Types

We have seen `vector` type in the previous section. In this section, we will show other vector types.

## `bvector` binary vector

The `bvector` type is a binary vector type in pgvecto.rs. It represents a binary vector, which is a vector where each component can take on two possible values, typically 0 and 1. 

Here's an example of creating a table with a bvector column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding bvector(3) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[1,0,1]'), ('[0,1,0]');
```

Index can be created on `bvector` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding bvector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[1,0,1]' LIMIT 5;
```

We support three operators to calculate the distance between two `bvector` values.

- `<->` (`bvector_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$. The Hamming distance is equivalent to the squared Euclidean distance for binary vectors.
- `<#>` (`bvector_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`bvector_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.
- `<~>` (`bvector_jaccard_ops`): Jaccard distance, defined as $1 - \frac{|X\cap Y|}{|X\cup Y|}$.

There is also a function `binarize` to build `bvector` from `vector`:
```sql
SELECT binarize('[-2, -1, 0, 1, 2]');;
-- [0, 0, 0, 1, 1]
```

### Performance

The `bvector` type is optimized for storage and performance. It uses a bit-packed representation to store the binary vector. The distance calculation is also optimized for binary vectors.

Here are some performance benchmarks for the `bvector` type. We use the [dbpedia-entities-openai3-text-embedding-3-large-3072-1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) dataset for the benchmark. The VM is n2-standard-8 (8 vCPUs, 32 GB memory) on Google Cloud.

We upsert 1M binary vectors into the table and then run a KNN query for each embedding. It only takes about 600MB memory to index 1M binary vectors, while the `vector` type takes about 18GB memory to index the same number of vectors.

![bvector](./images/bvector.png)

We can see that the `bvector`'s accuracy is not as good as the `vector` type, but it exceeds 95%  if we adopt [adaptive retrieval](/use-case/adaptive-retrieval).

## `svector` sparse vector

Unlike dense vectors, sparse vectors are very high-dimensional but contain few non-zero values.

Typically, sparse vectors can be created from:
- Word co-occurrence matrices
- Term frequency-inverse document frequency (TF-IDF) vectors
- User-item interaction matrices
- Network adjacency matrices

Sparse vectors in `pgvecto.rs` are called `svector`.

Here's an example of creating a table with a svector column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding svector(10) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[0.1,0,0,0,0,0,0,0,0,0]'), ('[0,0,0,0,0,0,0,0,0,0.5]');
```

Index can be created on `svector` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding svector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[0.3,0,0,0,0,0,0,0,0,0]' LIMIT 1;
```

We support three operators to calculate the distance between two `svector` values.

- `<->` (`svector_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`svector_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`svector_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

There is also a function `to_svector` to build `svector`:
```sql
SELECT to_svector(5, '{0,4}', '{0.3,0.5}');
-- [0.3, 0, 0, 0, 0.5]
```

## `vecf16` half-precision vector

Stored as a half-precision number format, `vecf16` takes advantage of the 16-bit float, which uses half the memory and bandwidth compared to `vector`.
It is often faster than the regular `vector` datatype, but may lose some precision.

Here's an example of creating a table with a vecf16 column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding vecf16(3) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[0.1, 0.2, 0]'), ('[0, 0.1, 0.2]');
```

Index can be created on `vecf16` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding vecf16_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[0.3,0.2,0.1]' LIMIT 1;
```

We support three operators to calculate the distance between two `vecf16` values.

- `<->` (`vecf16_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`vecf16_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`vecf16_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

## Casts

For vector types, these casts are guaranteed:
- From `ARRAY` to `vector`
- From `vector` to `bvector` or `svector`
- From `vector` to `vecf16` or `veci8`
- From `svector` to `svecf16`

This diagram shows the conversion between different data types, where the types connected by arrows can be cast to each other:

<iframe class="quiver-embed" src="https://q.uiver.app/#q=WzAsNyxbMywyLCJcXHRleHR7dmVjdG9yfSJdLFsyLDAsIlxcdGV4dHt2ZWNmMTZ9Il0sWzQsMCwiXFx0ZXh0e3ZlY2k4fSJdLFszLDUsIlxcdGV4dHtidmVjdG9yfSJdLFswLDIsIlxcdGV4dHtBUlJBWX0iXSxbNiwyLCJcXHRleHR7c3ZlY3Rvcn0iXSxbNywwLCJcXHRleHR7c3ZlY2YxNn0iXSxbMiwwXSxbMCwyXSxbMSwwXSxbMCwxXSxbMywwXSxbMCwzXSxbNCwwLCIiLDAseyJzdHlsZSI6eyJib2R5Ijp7Im5hbWUiOiJkb3R0ZWQifX19XSxbMCw1XSxbNSwwXSxbNiw1XSxbNSw2XSxbMCw0LCIiLDAseyJzdHlsZSI6eyJib2R5Ijp7Im5hbWUiOiJkb3R0ZWQifX19XV0=&embed" width="90%" height="440" style="border-radius: 8px; border: none;"></iframe>

Among them, `ARRAY` is a native type of `postgreSQL`, others are types defined by `pgvecto.rs`.
