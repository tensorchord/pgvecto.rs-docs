# Schema

Here is the schema provided by `pgvecto.rs`.

## List of data types

| Name              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| vector            | vector, scalar type of which is `binary32`  defined in IEEE 754-2008        |
| vecf16            | vector, scalar type of which is `binary16`  defined in IEEE 754-2008        |
| veci8             | vector, scalar type of which is `8-bit Integer`                             |
| svector           | sparse vector, scalar type of which is `binary32`  defined in IEEE 754-2008 |
| bvector           | binary vector, a fixed-length bit string                                    |
| vector_index_stat | a composite type representing vector index statistics                       |

## List of operators

| Name | Left arg type | Right arg type | Result type | Description                 |
| ---- | ------------- | -------------- | ----------- | --------------------------- |
| +    | vector        | vector         | vector      | element-wise arithmetic     |
| +    | vecf16        | vecf16         | vecf16      | element-wise arithmetic     |
| +    | veci8         | veci8          | veci8       | element-wise arithmetic     |
| +    | svector       | svector        | svector     | element-wise arithmetic     |
| -    | vector        | vector         | vector      | element-wise arithmetic     |
| -    | vecf16        | vecf16         | vecf16      | element-wise arithmetic     |
| -    | veci8         | veci8          | veci8       | element-wise arithmetic     |
| -    | svector       | svector        | svector     | element-wise arithmetic     |
| &    | bvector       | bvector        | bvector     | element-wise logical AND    |
| \|   | bvector       | bvector        | bvector     | element-wise logical OR     |
| ^    | bvector       | bvector        | bvector     | element-wise logical XOR    |
| =    | vector        | vector         | boolean     | dictionary order comparison |
| =    | vecf16        | vecf16         | boolean     | dictionary order comparison |
| =    | veci8         | veci8          | boolean     | dictionary order comparison |
| =    | svector       | svector        | boolean     | dictionary order comparison |
| =    | bvector       | bvector        | boolean     | dictionary order comparison |
| <>   | vector        | vector         | boolean     | dictionary order comparison |
| <>   | vecf16        | vecf16         | boolean     | dictionary order comparison |
| <>   | veci8         | veci8          | boolean     | dictionary order comparison |
| <>   | svector       | svector        | boolean     | dictionary order comparison |
| <>   | bvector       | bvector        | boolean     | dictionary order comparison |
| <    | vector        | vector         | boolean     | dictionary order comparison |
| <    | vecf16        | vecf16         | boolean     | dictionary order comparison |
| <    | veci8         | veci8          | boolean     | dictionary order comparison |
| <    | svector       | svector        | boolean     | dictionary order comparison |
| <    | bvector       | bvector        | boolean     | dictionary order comparison |
| >    | vector        | vector         | boolean     | dictionary order comparison |
| >    | vecf16        | vecf16         | boolean     | dictionary order comparison |
| >    | veci8         | veci8          | boolean     | dictionary order comparison |
| >    | svector       | svector        | boolean     | dictionary order comparison |
| >    | bvector       | bvector        | boolean     | dictionary order comparison |
| <=   | vector        | vector         | boolean     | dictionary order comparison |
| <=   | vecf16        | vecf16         | boolean     | dictionary order comparison |
| <=   | veci8         | veci8          | boolean     | dictionary order comparison |
| <=   | svector       | svector        | boolean     | dictionary order comparison |
| <=   | bvector       | bvector        | boolean     | dictionary order comparison |
| >=   | vector        | vector         | boolean     | dictionary order comparison |
| >=   | vecf16        | vecf16         | boolean     | dictionary order comparison |
| >=   | veci8         | veci8          | boolean     | dictionary order comparison |
| >=   | svector       | svector        | boolean     | dictionary order comparison |
| >=   | bvector       | bvector        | boolean     | dictionary order comparison |
| <->  | vector        | vector         | real        | squared Euclidean distance  |
| <->  | vecf16        | vecf16         | real        | squared Euclidean distance  |
| <->  | veci8         | veci8          | real        | squared Euclidean distance  |
| <->  | svector       | svector        | real        | squared Euclidean distance  |
| <->  | bvector       | bvector        | real        | squared Euclidean distance  |
| <#>  | vector        | vector         | real        | negative dot product        |
| <#>  | vecf16        | vecf16         | real        | negative dot product        |
| <#>  | veci8         | veci8          | real        | negative dot product        |
| <#>  | svector       | svector        | real        | negative dot product        |
| <#>  | bvector       | bvector        | real        | negative dot product        |
| <=>  | vector        | vector         | real        | cosine distance             |
| <=>  | vecf16        | vecf16         | real        | cosine distance             |
| <=>  | veci8         | veci8          | real        | cosine distance             |
| <=>  | svector       | svector        | real        | cosine distance             |
| <=>  | bvector       | bvector        | real        | cosine distance             |
| <~>  | bvector       | bvector        | real        | jaccard distance            |

## List of functions

| Name               | Argument type                               | Result type | Description                                                                                 |
| ------------------ | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| pgvectors_upgrade  |                                             | void        | Administration function for upgrading `pgvecto.rs`.                                         |
| to_svector         | dims integer, index integer[], value real[] | svector     | Construct a sparse vector from two arrays of indexes and values                             |
| binarize           | vector vector                               | bvector     | Binarize a vector. All positive elements are set to 1, otherwise 0.                         |
| text2vec_openai    | input text, model text                      | vector      | Embedding function for OpenAI embeddings API.                                               |
| text2vec_openai_v3 | input text                                  | vector      | Embedding function for OpenAI embeddings API. The model is set to `text-embedding-3-small`. |

## List of casts

| Source type | Target type | Implicit? |
| ----------- | ----------- | --------- |
| real[]      | vector      | yes       |
| vector      | real[]      | yes       |
| vector      | vecf16      | no        |
| vecf16      | vector      | no        |
| vector      | veci8       | no        |
| veci8       | vector      | no        |
| vector      | svector     | no        |
| svector     | vector      | no        |
| vector      | bvector     | no        |
| bvector     | vector      | no        |

## List of access methods

| Name    | Type  | Description             |
| ------- | ----- | ----------------------- |
| vectors | Index | pgvecto.rs vector index |

## List of operator families

| AM      | Operator family     | Applicable types |
| ------- | ------------------- | ---------------- |
| vectors | vector_cos_ops      | vector           |
| vectors | vector_dot_ops      | vector           |
| vectors | vector_l2_ops       | vector           |
| vectors | vecf16_cos_ops      | vecf16           |
| vectors | vecf16_dot_ops      | vecf16           |
| vectors | vecf16_l2_ops       | vecf16           |
| vectors | veci8_cos_ops       | veci8           |
| vectors | veci8_dot_ops       | veci8           |
| vectors | veci8_l2_ops        | veci8           |
| vectors | svector_cos_ops     | svector          |
| vectors | svector_dot_ops     | svector          |
| vectors | svector_l2_ops      | svector          |
| vectors | bvector_cos_ops     | bvector          |
| vectors | bvector_dot_ops     | bvector          |
| vectors | bvector_l2_ops      | bvector          |
| vectors | bvector_jaccard_ops | bvector          |

## List of operator classes

| AM      | Input type | Operator class      | Default? | Description                |
| ------- | ---------- | ------------------- | -------- | -------------------------- |
| vectors | vector     | vector_l2_ops       | no       | squared Euclidean distance |
| vectors | vector     | vector_dot_ops      | no       | negative dot product       |
| vectors | vector     | vector_cos_ops      | no       | cosine distance            |
| vectors | vecf16     | vecf16_l2_ops       | no       | squared Euclidean distance |
| vectors | vecf16     | vecf16_dot_ops      | no       | negative dot product       |
| vectors | vecf16     | vecf16_cos_ops      | no       | cosine distance            |
| vectors | veci8      | veci8_l2_ops        | no       | squared Euclidean distance |
| vectors | veci8      | veci8_dot_ops       | no       | negative dot product       |
| vectors | veci8      | veci8_cos_ops       | no       | cosine distance            |
| vectors | svector    | svector_l2_ops      | no       | squared Euclidean distance |
| vectors | svector    | svector_dot_ops     | no       | negative dot product       |
| vectors | svector    | svector_cos_ops     | no       | cosine distance            |
| vectors | bvector    | bvector_l2_ops      | no       | squared Euclidean distance |
| vectors | bvector    | bvector_dot_ops     | no       | negative dot product       |
| vectors | bvector    | bvector_cos_ops     | no       | cosine distance            |
| vectors | bvector    | bvector_jaccard_ops | no       | jaccard distance           |

## List of views

| Name                 | Description                                 |
| -------------------- | ------------------------------------------- |
| pg_vector_index_stat | A view provided for vector index statistics |
