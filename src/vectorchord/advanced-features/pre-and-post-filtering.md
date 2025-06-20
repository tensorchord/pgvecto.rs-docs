# Prefiltering And Postfiltering <badge type="tip" text="since v0.4.0" />

VectorChord provides flexible filtering mechanisms to improve vector search performance and accuracy through **prefiltering** and **postfiltering** strategies. These filtering approaches determine when query conditions (like `WHERE` clauses) are applied during the vector similarity search process.

## Structure

**Prefiltering**: Apply an additional filter before the `search (original)` step.

$$\text{search (quantized)} \Rightarrow \text{filter (pre)} \Rightarrow \text{search (original)} \Rightarrow \text{filter (PG)}\Rightarrow \text{results}$$

**Postfiltering**: Use the PostgreSQL native filter after the `search (original)` step.

$$\text{search (quantized)} \Rightarrow \text{search (original)} \Rightarrow \text{filter (PG)}\Rightarrow \text{results}$$

## Configuration

You can control the filtering strategy using the `vchordrq.prefilter` setting:

```sql
-- Enable prefiltering (default: off)
SET vchordrq.prefilter = on;

-- Use postfiltering  
SET vchordrq.prefilter = off;
```

:::warning
For complex queries, such as joint queries.
Whether the prefilter takes effect is greatly affected by the [planner/optimizer](https://www.postgresql.org/docs/current/planner-optimizer.html). Please evaluate carefully based on experiments.
:::

## Performance Trade-offs

Use prefiltering when:
- Your filtering conditions are highly selective (eliminate many candidates)
- The filter is simple
- You are using [Rerank In Table](./rerank-in-table) index, while prefiltering can significantly reduce latency

Use postfiltering when:
- Your filtering conditions are less selective
- The filtering logic is complex or the filter is a costly operation

| Example                   | All rows | Selected rows | Select rate |
| ------------------------- | -------- | ------------- | ----------- |
| A low selective filter    | 1000     | 900           | 90%         |
| A medium selective filter | 1000     | 300           | 30%         |
| A highly selective filter | 1000     | 10            | 1%          |

::: warning
If your filter is not a [pure function](https://en.wikipedia.org/wiki/Pure_function) and have some [side effects](https://en.wikipedia.org/wiki/Side_effect_(computer_science)), `vchordrq.prefilter` could cause a change in behavior.
:::

---

Based on our experimental results, the QPS speedup at different `select rate` is as follows:
- 200% speedup at a select rate of 1%
- Not significant (5%) speedup at a select rate of 10%

<img src="../images/prefilter.png" alt="Pre-Filtering on LAION-5m" style="width: 100%; height: auto; margin: 0 auto; display: block;" />