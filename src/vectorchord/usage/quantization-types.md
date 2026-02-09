# Quantization Types <badge type="tip" text="since v1.1.0" />

Quantization can be applied not only to indexes but also directly to vectors. To this end, VectorChord provides data types for quantized vectors.

`rabitq8` is the data type of a quantized vector. For the same dimension, its cost is about $\frac{1}{4}$ that of a full-precision vector (`vector`) and $\frac{1}{2}$ that of a half-precision vector (`halfvec`). This type is named after its quantization algorithm.[^exrabitq]

[^exrabitq]: Jianyang Gao, Yutong Gou, Yuexuan Xu, Yongyi Yang, Cheng Long, Raymond Chi-Wing Wong, "Practical and Asymptotically Optimal Quantization of High-Dimensional Vectors in Euclidean Space for Approximate Nearest Neighbor Search", SIGMOD 2025, available at https://arxiv.org/abs/2409.09913.

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embedding rabitq8(3));
INSERT INTO items (embedding) VALUES (quantize_to_rabitq8('[0,0,0]'::vector));
INSERT INTO items (embedding) VALUES (quantize_to_rabitq8('[1,1,1]'::vector));
INSERT INTO items (embedding) VALUES (quantize_to_rabitq8('[2,2,2]'::vector));
--- ...
SELECT id FROM items ORDER BY embedding <-> quantize_to_rabitq8('[0.9,0.9,1.1]'::vector) LIMIT 100;
```

Like them, an index can be created on columns of type `rabitq8`, too.

```sql
CREATE INDEX ON items USING vchordrq (embedding rabitq8_l2_ops);
```

By using `rabitq8`, both the table size and index size become $\frac{1}{4}$ of what they would be when the type of the column is `vector`. The cost is that both performance and precision are compromised by quantization noticeably. Therefore, it is applicable in scenarios that retrieve a large number of results.

In addition, there is also the `rabitq4` type. `rabitq8` quantized vectors use $8$ bits per dimension, whereas `rabitq4` quantized vectors use only $4$ bits per dimension. It is designed for constrained situations that favor low storage over high precision.

## Reference

### Operator Classes

Refer to

* [Operator Classes (`vchordrq`)](indexing#operator-classes).
* [Operator Classes (`vchordg`)](graph-index#operator-classes).

### Types

#### `rabitq8` <badge type="tip" text="since v1.1.0" />

- Description: The data type of a quantized vector that uses `uint8` for internal storage. It's based on extended RaBitQ.[^exrabitq]

#### `rabitq4` <badge type="tip" text="since v1.1.0" />

- Description: The data type of a quantized vector that uses `uint4` for internal storage. It's based on extended RaBitQ.[^exrabitq]

### Functions

#### `quantize_to_rabitq8(vector)` <badge type="tip" text="since v1.1.0" />

- Description: Quantizes a vector to `rabitq8`.
- Result: `rabitq8`, the quantized vector
- Arguments:
    - `vector`, the vector to be quantized
- Example:
    - `SELECT quantize_to_rabitq8('[1,1,1]'::vector)`

#### `quantize_to_rabitq8(halfvec)` <badge type="tip" text="since v1.1.0" />

- Description: Quantizes a vector to `rabitq8`.
- Result: `rabitq8`, the quantized vector
- Arguments:
    - `halfvec`, the vector to be quantized
- Example:
    - `SELECT quantize_to_rabitq8('[1,1,1]'::halfvec)`

#### `quantize_to_rabitq4(vector)` <badge type="tip" text="since v1.1.0" />

- Description: Quantizes a vector to `rabitq4`.
- Result: `rabitq4`, the quantized vector
- Arguments:
    - `vector`, the vector to be quantized
- Example:
    - `SELECT quantize_to_rabitq4('[1,1,1]'::vector)`

#### `quantize_to_rabitq4(halfvec)` <badge type="tip" text="since v1.1.0" />

- Description: Quantizes a vector to `rabitq4`.
- Result: `rabitq4`, the quantized vector
- Arguments:
    - `halfvec`, the vector to be quantized
- Example:
    - `SELECT quantize_to_rabitq4('[1,1,1]'::halfvec)`

### Operators

#### `<->(rabitq8, rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates L2 distance of two quantized vectors.
- Result: `real`, L2 distance of two quantized vectors
- Arguments:
    - `rabitq8`
    - `rabitq8`

#### `<#>(rabitq8, rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates negative dot product distance of two quantized vectors.
- Result: `real`, negative dot product distance of two quantized vectors
- Arguments:
    - `rabitq8`
    - `rabitq8`

#### `<=>(rabitq8, rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates cosine distance of two quantized vectors.
- Result: `real`, cosine distance of two quantized vectors
- Arguments:
    - `rabitq8`
    - `rabitq8`

#### `<->(rabitq4, rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates L2 distance of two quantized vectors.
- Result: `real`, L2 distance of two quantized vectors
- Arguments:
    - `rabitq4`
    - `rabitq4`

#### `<#>(rabitq4, rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates negative dot product distance of two quantized vectors.
- Result: `real`, negative dot product distance of two quantized vectors
- Arguments:
    - `rabitq4`
    - `rabitq4`

#### `<=>(rabitq4, rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Calculates cosine distance of two quantized vectors.
- Result: `real`, cosine distance of two quantized vectors
- Arguments:
    - `rabitq4`
    - `rabitq4`
