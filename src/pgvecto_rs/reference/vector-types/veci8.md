# 8-Bit Integer Vector: `veci8` <Badge type="tip" text="since v0.3.0" />

`Int8` is a data type used to represent signed integers. It stands for "integer 8-bit" and typically uses 8 bits of memory to store a value. This allows it to represent integer values ranging from `-128` to `127`.

Since each element in the vector only requires 8 bits (1 byte) of memory, `veci8` can help reduce the overall memory footprint of your program.

Here's an example of creating a table with a `veci8` column and inserting values:

```sql {3}
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  embedding veci8(3) NOT NULL
);

INSERT INTO items (embedding) VALUES ('[1, 2, 0]'), ('[-1, 15, -2]');
```

Index can be created on `veci8` type as well.

```sql
CREATE INDEX your_index_name ON items USING vectors (embedding veci8_l2_ops);

SELECT * FROM items ORDER BY embedding <-> '[0.3,0.2,0.1]' LIMIT 1;
```

We support three operators to calculate the distance between two `veci8` values.

- `<->` (`veci8_l2_ops`): squared Euclidean distance, defined as $\Sigma (x_i - y_i) ^ 2$.
- `<#>` (`veci8_dot_ops`): negative dot product, defined as $- \Sigma x_iy_i$.
- `<=>` (`veci8_cos_ops`): cosine distance, defined as $1 - \frac{\Sigma x_iy_i}{\sqrt{\Sigma x_i^2 \Sigma y_i^2}}$.