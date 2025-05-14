# Range Query

To query vectors within a certain distance range, you can use the following syntax.
```SQL
-- Query vectors within a certain distance range
SELECT vec FROM t WHERE vec <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012) 
ORDER BY embedding <-> '[0.24, 0.24, 0.24]' LIMIT 5;
```

In this expression, `vec <<->> sphere('[0.24, 0.24, 0.24]'::vector, 0.012)` is equal to `vec <-> '[0.24, 0.24, 0.24]' < 0.012`. However, the latter one will trigger a **exact nearest neighbor search** as the grammar could not be pushed down.

Supported range functions are:
- `<<->>` - L2 distance
- `<<#>>` - (negative) inner product
- `<<=>>` - cosine distance

:::warning
MaxSim operator does not support range query yet.
:::
