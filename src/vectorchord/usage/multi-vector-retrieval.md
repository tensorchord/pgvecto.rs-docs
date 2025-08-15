# Multi-Vector Retrieval <badge type="tip" text="since v0.3.0" />

Multi-Vector Retrieval is an advanced technique used in Retrieval-Augmented Generation (RAG) systems to enhance document retrieval by leveraging multiple vectors per document.

Unlike Single-Vector Retrieval, Multi-Vector Retrieval using the `MaxSim` operator enables capturing fine-grained semantic relationships.

Refer to [our blog](https://blog.vectorchord.ai/beyond-text-unlock-ocr-free-rag-in-postgresql-with-modal-and-vectorchord) for more details on building an end-to-end Multi-Vector Retrieval application.

## How to start

Late interaction models embed documents and queries as vector arrays separately and compute similarity through an operator called `MaxSim`. The definition of the `MaxSim` operator is $\sum_i \max_j q_i \cdot d_j$, meaning that for each vector in the query vector array, the closest vector in the document vector array is found, their dot product is calculated, and the results are summed.

In VectorChord, the symbol for this operator is `@#`. The left operand is the document vector array, and the right operand is the query vector array. While the original `MaxSim` operator is similarity-based, while the operator in VectorChord is based on distance. VectorChord’s implementation interprets it as a distance metric by negating the similarity score.

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

Queries using the `MaxSim` operator can be accelerated with indexing, like other vector operators.

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

## Reference

This feature is not supported by `vchordg`.

### Operator Classes

Refer to

* [Operator Classes (`vchordrq`)](indexing#operator-classes).

### Search Parameters <badge type="info" text="vchordrq" />

The indexing mechanism for `MaxSim` operators works similarly to other vector operators. When an index is built on a column of vector arrays, each vector within the arrays is individually inserted into the index data structure. During querying, the index performs a separate vector search for each vector in the query array. By default, the index does not rerank the results. Instead, it uses RaBitQ's estimated distances as a substitute for actual distances. The index then merges the results from all separated vector searches to produce the final output.

There are a few extra parameters used by maxsim indexes.

#### `vchordrq.maxsim_refine` <badge type="tip" text="since v0.3.0" />

- Description: This GUC parameter `vchordrq.maxsim_refine` makes the index rerank the results, replacing RaBitQ’s estimated distances with actual distances, until the distances of the top-k nearest vectors have all been recalculated.
- Type: integer
- Domain: `[0, 2147483647]`
- Default: `0`
- Example:
    - `SET vchordrq.maxsim_refine = 0` means that the index always uses RaBitQ's estimated distances.
    - `SET vchordrq.maxsim_refine = 1024` means that the index reranks the results, replacing RaBitQ’s estimated distances with actual distances, until the distances of the top-1024 nearest vectors have all been recalculated.

#### `vchordrq.maxsim_threshold` <badge type="tip" text="since v0.3.0" />

- Description: This GUC parameter `vchordrq.maxsim_threshold` enables more aggressive estimation of missing values. With this setting, the index identifies the first cluster in the lowest-level lists whose cumulative size meets or exceeds `vchordrq.maxsim_threshold`, and uses its distance to the query vector for estimating the missing values.
- Type: integer
- Domain: `[0, 2147483647]`
- Default: `0`
- Example:
    - `SET vchordrq.maxsim_threshold = 0` means that the more aggressive estimation strategy is not enabled.
    - `SET vchordrq.maxsim_threshold = 1024` means that the index identifies the first cluster in the lowest-level lists whose cumulative size meets or exceeds `1024`, and uses its distance to the query vector for estimating the missing values.
