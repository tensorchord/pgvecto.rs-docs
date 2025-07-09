# Vector Types

In the previous sections [Indexing](../usage/indexing) and [Search](../usage/search), we encountered the `vector` type. This section will explore additional vector types and their applications in the realm of vector search.

- [Half-Precision Vector](../reference/vector-types/vecf16)
- [8-Bit Integer Vector](../reference/vector-types/veci8) <Badge type="tip" text="since v0.3.0" />
- [Sparse Vector](../reference/vector-types/svector) <Badge type="tip" text="since v0.3.0" />
- [Binary Vector](../reference/vector-types/bvector) <Badge type="tip" text="since v0.3.0" />

## Low-precision Indexing <Badge type="tip" text="since v0.3.0" />

To improve the speed of queries on the `vector` column, consider creating a low-precision index using `vecf16`, `veci8`, or `bvector` types instead of a `vector` type.

```sql
CREATE TABLE t (val vector(3));
INSERT INTO t (val) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);

-- Create bvector index at vector column
-- Warning: Float32 vectors are truncated to 
--          integers of either 0 or 1 during index construction
CREATE INDEX lp_bin ON t USING vectors ((binarize(val)::bvector(3)) bvector_l2_ops);

-- Create vecf16 index at vector column
CREATE INDEX lp_f16 ON t USING vectors ((val::vecf16(3)) vecf16_l2_ops);

-- Create veci8 index at vector column
-- Warning: Float32 vectors are truncated to 
--          integers ranging from -128 to 127 during index construction
CREATE INDEX lp_i8 ON t USING vectors ((val::veci8(3)) veci8_l2_ops);
```

## Shortening Embedding <Badge type="tip" text="since v0.3.0" />

Certain embedding models like OpenAI `text-embedding-3-small` support [shortening embeddings](https://openai.com/blog/new-embedding-models-and-api-updates), which involves removing some numbers from the end of the sequence without losing the embedding's concept-representing properties.

In some cases, it may be necessary to change the embedding dimension after generation. The `pgvecto.rs` offers an approach to query by shortened embeddings.

```sql
CREATE TABLE t (val vector(3));
INSERT INTO t (val) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
CREATE INDEX ON t USING vectors (val vector_l2_ops);

-- Measure distance using only the first two dimensions
SELECT * from t ORDER BY (val[:2])::vector(2) <-> '[3, 2]'::vector;
```

Shortened embeddings are supported by all data types in `pgvecto.rs` since version `v0.3.0`.

## Casts

This diagram shows the conversion between different data types, where the types connected by arrows can be cast to each other:

<iframe class="quiver-embed" src="https://q.uiver.app/?q=WzAsNyxbMywyLCJcXHRleHR7dmVjdG9yfSJdLFsyLDAsIlxcdGV4dHt2ZWNmMTZ9Il0sWzQsMCwiXFx0ZXh0e3ZlY2k4fSJdLFszLDUsIlxcdGV4dHtidmVjdG9yfSJdLFswLDIsIlxcdGV4dHtBUlJBWX0iXSxbNiwyLCJcXHRleHR7c3ZlY3Rvcn0iXSxbNywwLCJcXHRleHR7c3ZlY2YxNn0iXSxbMiwwXSxbMCwyXSxbMSwwXSxbMCwxXSxbMywwXSxbMCwzXSxbNCwwLCIiLDAseyJzdHlsZSI6eyJib2R5Ijp7Im5hbWUiOiJkb3R0ZWQifX19XSxbMCw1XSxbNSwwXSxbNiw1XSxbNSw2XSxbMCw0LCIiLDAseyJzdHlsZSI6eyJib2R5Ijp7Im5hbWUiOiJkb3R0ZWQifX19XV0=&embed" width="90%" height="440" style="border-radius: 8px; border: none;"></iframe>

Among them, `ARRAY` is a native type of `postgreSQL`, others are types defined by `pgvecto.rs`.

Here are some examples of vector type casting:
```sql
-- OK: String ⇒ vector
SELECT '{1,2,3}'::vector;

-- OK: vector ⇒ ARRAY
SELECT '{1,2,3}'::vector::real[];

-- OK: ARRAY ⇒ vector ⇒ bvector
SELECT ARRAY[1.0 ,0 ,0]::real[]::vector::bvector;

-- ERROR: cannot cast type vecf16 to veci8
SELECT '[3, 2]'::vecf16::veci8;

-- OK: vecf16 ⇒ vector ⇒ veci8
SELECT '[3, 2]'::vecf16::vector::veci8;
```