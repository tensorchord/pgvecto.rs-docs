# Similarity Filter

To query vectors within a certain distance threshold, you can use the following syntax.
```SQL
-- Query vectors within a certain distance threshold
SELECT * FROM items WHERE embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012);
```

The expression `sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` refers to a spherical region with its center at `'[0.24, 0.24, 0.24]'` and a radius of `0.012`.

The expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` evaluates to `true` if the embedding is within the spherical region. Semantically, this is equivalent to `embedding <-> '[0.24, 0.24, 0.24]' < 0.012`.

However, the expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` can be correctly handled by the `vchordrq` index, while the expression `embedding <-> '[0.24, 0.24, 0.24]' < 0.012` can't.

These comparison operators are used for similarity filter:

| Operator | Description                           |
| -------- | ------------------------------------- |
| `<<->>`  | Tests if L2 distance <= threshold     |
| `<<#>>`  | Tests if inner product <= threshold   |
| `<<=>>`  | Tests if cosine distance <= threshold |

:::warning
[Multi-Vector Retrieval](multi-vector-retrieval) does not support similarity filter yet.
:::
