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

We support three operators to calculate the distance between two `bvector` values.

- `<->` (`bvector_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$. The Hamming distance is equivalent to the squared Euclidean distance for binary vectors.
- `<#>` (`bvector_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`bvector_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.
- `<~>` (`bvector_jaccard_ops`): Jaccard distance, defined as $1 - \frac{|X\cap Y|}{|X\cup Y|}$.

Index can be created on `bvector` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding bvector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[1,0,1]' LIMIT 5;
```

### Data type cast

Cast between `vector`:
```sql
SELECT '[1, 0, 1]'::vector::bvector;
SELECT '[1, 0, 1]'::bvector::vector;
```

From `ARRAY` or `real[]` to bvector:
```sql
SELECT ARRAY[1, 0, 1]::real[]::vector::bvector;
```

From string constructor:
```sql
SELECT '[1, 0, 1]'::bvector;
```

From binarize constructor:
```sql
SELECT binarize(ARRAY[-2, -1, 0, 1, 2]::real[]::vector);;
-- [0, 0, 0, 1, 1]
```

### Performance

The `bvector` type is optimized for storage and performance. It uses a bit-packed representation to store the binary vector. The distance calculation is also optimized for binary vectors.

Here are some performance benchmarks for the `bvector` type. We use the [dbpedia-entities-openai3-text-embedding-3-large-3072-1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) dataset for the benchmark. The VM is n2-standard-8 (8 vCPUs, 32 GB memory) on Google Cloud.

We upsert 1M binary vectors into the table and then run a KNN query for each embedding. It only takes about 600MB memory to index 1M binary vectors, while the `vector` type takes about 18GB memory to index the same number of vectors.

![bvector](./images/bvector.png)

We can see that the `bvector`'s accuracy is not as good as the `vector` type, but it exceeds 95%  if we adopt [adaptive retrieval](/use-case/adaptive-retrieval).

## `svector` sparse vector

Different from dense vectors, sparse vectors are very high-dimensional but contain few non-zero values. Though you can treat them as traditional dense vectors, they can be calculated and stored much more efficiently by [some ways](https://en.wikipedia.org/wiki/Sparse_matrix).

Typically, sparse vectors could generated from:
- Word-word occurrence matrices
- Term frequency-inverse document frequency (TF-IDF) vectors
- User-item interaction matrices
- Network adjacency matrices

`pgvecto.rs` supports sparse vectors, it's called `svector`.

::: tip
`svector` is 32-bit float, 16-bit float sparse vector is not supported now.
:::

Here's an example of creating a table with a svector column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding svector(10) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[0.1,0,0,0,0,0,0,0,0,0]'), ('[0,0,0,0,0,0,0,0,0,0.5]');
```

We support three operators to calculate the distance between two `svector` values.

- `<->` (`svector_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`svector_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`svector_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

Index can be created on `svector` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding svector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[0.3,0,0,0,0,0,0,0,0,0]' LIMIT 1;
```

### Data type cast

Cast between `vector`:
```sql
SELECT '[0.3, 0, 0, 0, 0.5]'::vector::svector;
SELECT '[0.3, 0, 0, 0, 0.5]'::svector::vector;
```

From `ARRAY` or `real[]` to svector:
```sql
SELECT ARRAY[random(), 0, 0, 0, 0.5]::real[]::vector::svector;
```

From string constructor:
```sql
SELECT '[0.3, 0, 0, 0, 0.5]'::svector;
```

From index and value constructor:
```sql
SELECT to_svector(5, '{0,4}', '{0.3,0.5}');
-- [0.3, 0, 0, 0, 0.5]
```

## `vecf16` half-precision vector

Stored as half precision format number format, `vecf16` take advantage of 16-bit float, which requires half the storage and bandwidth compared to `vector`.
It is often faster than regular `vector` data type, but may lose some precision.

Here's an example of creating a table with a vecf16 column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding vecf16(3) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[0.1, 0.2, 0]'), ('[0, 0.1, 0.2]');
```

We support three operators to calculate the distance between two `vecf16` values.

- `<->` (`vecf16_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`vecf16_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`vecf16_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

Index can be created on `vecf16` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding vecf16_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[0.3,0.2,0.1]' LIMIT 1;
```

### Data type cast

Cast between `vector`:
```sql
SELECT '[0.3, 0.2, 0.1]'::vector::vecf16;
SELECT '[0.3, 0.2, 0.1]'::vecf16::vector;
```

From `ARRAY` or `real[]` to vecf16:
```sql
SELECT ARRAY[random(), 0, 0.1]::real[]::vector::vecf16;
```

From string constructor:
```sql
SELECT '[0.3, 0.2, 0.1]'::vecf16;
```
