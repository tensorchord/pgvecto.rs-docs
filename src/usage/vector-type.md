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

- `<->` (`bvector_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`bvector_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`bvector_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.

Index can be created on `bvector` type as well.

```sql
CREATE INDEX bvector ON items USING vectors (embedding bvector_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[1,0,1]' LIMIT 5;
```

### Performance

The `bvector` type is optimized for storage and performance. It uses a bit-packed representation to store the binary vector. The distance calculation is also optimized for binary vectors.

Here are some performance benchmarks for the `bvector` type. We use the [dbpedia-entities-openai3-text-embedding-3-large-3072-1M](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-large-3072-1M) dataset for the benchmark. The VM is n2-standard-8 (8 vCPUs, 32 GB memory) on Google Cloud.

We upsert 1M binary vectors into the table and then run a KNN query for each embedding. It only takes about 600MB memory to index 1M binary vectors.

![bvector](./images/bvector.png)

We can see that the `bvector`'s accuracy is not as good as the `vector` type, but it exceeds 95%  if we adopt adaptive retrieval.
