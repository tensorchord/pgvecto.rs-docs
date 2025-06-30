# Half-Precision Vector: `vecf16` 

Stored as a half-precision number format, `vecf16` takes advantage of the 16-bit float, which uses half the memory and bandwidth compared to `vector`.

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