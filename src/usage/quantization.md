# Quantization

Quantization is a technique to reduce the memory consumption and computation complexity with the affordable decrease in precision. In the context of vector search, there are mainly two types of quantization: production quantization and scalar quantization.

## Production Quantization

Production quantization is a method that trains several clustering models on the dataset and maps each vector to a list of cluster center indexes. It is commonly used address the problem of excessive memory usage with high-dimensional data.

In `pgvecto.rs`, you can enable the product quantization with:

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = $$
[indexing.ivf]
quantization.product.ratio = "x16"
$$);
```

More configurations can be found in [indexing](./indexing.md).

## Scalar Quantization

Scalar quantization maps each value to low-bit format like from 32-bit float to 16-bit float or 8-bit integer. Usually, this won't affect the precision a lot but can reduce the memory usage and improve the query performance. `pgvecto.rs` supports scalar quantization with:

```sql
CREATE INDEX ON items USING vectors (embedding vector_l2_ops)
WITH (options = "[indexing.hnsw.quantization.scalar]");
```

## Suggestions

When quantization is required, it's always recommended to try the float16 format first. It's a good balance between precision and memory usage. 

If the memory usage is still too high, you can try the product quantization. This method can reduce the memory usage significantly but may affect the precision. Since it's highly related to the training dataset. You need to try different `ratio` and `sample` values to find the best one for your dataset.
