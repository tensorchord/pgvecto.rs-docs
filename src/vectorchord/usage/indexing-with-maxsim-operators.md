# Indexing with MaxSim Operators

Late interaction models embed documents and queries as vector arrays separately and compute similarity through an operator called `MaxSim`. The definition of the `MaxSim` operator is $\sum_i \max_j q_i \cdot d_j$, meaning that for each vector in the query vector array, the closest vector in the document vector array is found, their dot product is calculated, and the results are summed.

In VectorChord, the symbol for this operator is `@#`. Left operand is the document vector array, and right operand is the query vector array. The original operator is based on similarity, while the operator in VectorChord is based on distance. Therefore, the operator `#@` is actually the negation of the result from `MaxSim`.

To construct an index for vector arrays, first create a table named `items` with a column named `embeddings` of type `vector(n)[]`. Then, populate the table with generated data.

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embeddings vector(3)[]);

INSERT INTO items (embeddings) 
SELECT
    ARRAY[
        ARRAY[random(), random(), random()]::vector,
        ARRAY[random(), random(), random()]::vector,
        ARRAY[random(), random(), random()]::vector
    ]
FROM generate_series(1, 1000);
```

Like other operators, queries that use the `MaxSim` operator can be accelerated through indexing.

```sql
CREATE INDEX ON items USING vchordrq (embeddings vector_maxsim_ops);
```

Then you can perform a vector search with the index.

```sql
SELECT * FROM items
ORDER BY embeddings @# 
    ARRAY[
        '[3,1,2]'::vector,
        '[2,2,2]'::vector
    ] LIMIT 5;
```

The table below shows the operator classes for types and operator in the index.

|                          | vector              | halfvec              |
| ------------------------ | ------------------- | -------------------- |
| `MaxSim` distance (`@#`) | `vector_maxsim_ops` | `halfvec_maxsim_ops` |

## Options

The indexing mechanism for `MaxSim` operators works similarly to other vector operators. When an index is built on a column of vector arrays, each vector within the arrays is individually inserted into the index data structure. During querying, the index performs a separate vector search for each vector in the query array. However, the index does not rerank the results. Instead, it uses RaBitQ's estimated distances as a substitute for distances. The index then merges the results from all separated vector searches to produce the final output.

There are a few extra options used by maxsim indexes.

### GUC Parameter `vchordrq.maxsim_refine`

Generally, the default index settings already offer great performance and acceptable accuracy. However, if you prefer great accuracy, you can do so by adjusting the GUC parameter `vchordrq.maxsim_refine`. This parameter makes the index rerank the results, replacing RaBitQ’s estimated distances with actual distances, until the distances of the top-k nearest vectors have all been recalculated. The default value is `0`, meaning the index always uses RaBitQ's estimated distances. The acceptable range is from `0` to `2,147,483,647`.

### GUC Parameter `vchordrq.maxsim_threshold`

As certain vectors are missing from the search results, the results cannot be directly merged. The `MaxSim` index estimates the missing values using the maximum distance of all distances. The GUC parameter `vchordrq.maxsim_threshold` enables more aggressive estimation of missing values. With this setting, the index identifies the first cluster in the lowest-level lists whose cumulative size meets or exceeds `vchordrq.maxsim_threshold`, and uses its distance to the query vector for estimating the missing values. The default value of `vchordrq.maxsim_threshold` is `0`, meaning this more aggressive estimation strategy is not enabled by default. The acceptable range is from `0` to `2,147,483,647`.
