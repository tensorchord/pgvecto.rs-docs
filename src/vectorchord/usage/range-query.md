# Range Query

To query vectors within a certain distance range, you can use the following syntax.
```SQL
-- Query vectors within a certain distance range
SELECT * FROM items WHERE embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012);
```

The expression `sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` refers to a spherical region with its center at `'[0.24, 0.24, 0.24]'` and a radius of `0.012`.

The expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` evaluates to `true` if the embedding is within the spherical region. Semantically, this is equivalent to `embedding <-> '[0.24, 0.24, 0.24]' < 0.012`.

However, if you have created the index like this:

```SQL
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops);
```

The expression `embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` can be correctly handled by the index, while the expression `embedding <-> '[0.24, 0.24, 0.24]' < 0.012` can't.

The table below shows the operator classes for types and operator in the index.

|                           | vector              | halfvec              |
| ------------------------- | ------------------- | -------------------- |
| L2 distance (`<<->>`)     | `vector_l2_ops`     | `halfvec_l2_ops`     |
| inner product (`<<#>>`)   | `vector_ip_ops`     | `halfvec_ip_ops`     |
| cosine distance (`<<=>>`) | `vector_cosine_ops` | `halfvec_cosine_ops` |

:::warning
MaxSim search does not support range query yet.
:::
