# Range Query

To query vectors within a certain distance range, you can use the following syntax.
```SQL
-- Query vectors within a certain distance range
SELECT * FROM items WHERE embedding <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012);
```

In this expression, `vec <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` is equal to `vec <-> '[0.24, 0.24, 0.24]' < 0.012`. However, the latter one will trigger a **exact nearest neighbor search** as the grammar could not be pushed down.

The table below shows the operator classes for types and operator in the index.

|                           | vector              | halfvec              |
| ------------------------- | ------------------- | -------------------- |
| L2 distance (`<<->>`)     | `vector_l2_ops`     | `halfvec_l2_ops`     |
| inner product (`<<#>>`)   | `vector_ip_ops`     | `halfvec_ip_ops`     |
| cosine distance (`<<=>>`) | `vector_cosine_ops` | `halfvec_cosine_ops` |

:::warning
MaxSim search does not support range query yet.
:::
