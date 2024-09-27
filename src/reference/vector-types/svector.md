# Sparse Vector: `svector` <Badge type="tip" text="since v0.3.0" />

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

There is also a function `to_svector` to create a `svector`. It will set the value at the specified position.

$$ F(index)=\left\{
\begin{array}{rcl}
value[v]  &      & {\exists v \in \mathbb{N}: position[v] = index }\\
0         &      & {else}\\
\end{array} \right. 
$$

```sql
-- to_svector(dim: INTEGER, position: ARRAY, value: ARRAY) -> svector
SELECT to_svector(5, '{0, 4}', '{0.3, 0.5}');
-- [0.3, 0, 0, 0, 0.5]
```
