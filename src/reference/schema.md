# Schema

Here is the schema provided by pgvecto.rs.

# List of data types

| Name              | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| vector            | vector, scalar type of which is “binary32”  defined in IEEE 754-2008 |
| vecf16            | vector, scalar type of which is “binary16”  defined in IEEE 754-2008 |
| vector_index_stat | a composite type representing vector index statistics                |

## List of operators

| Name | Left arg type | Right arg type | Result type | Description                 |
| ---- | ------------- | -------------- | ----------- | --------------------------- |
| +    | vector        | vector         | vector      | element-wise arithmetic     |
| +    | vecf16        | vecf16         | vecf16      | element-wise arithmetic     |
| -    | vector        | vector         | vector      | element-wise arithmetic     |
| -    | vecf16        | vecf16         | vecf16      | element-wise arithmetic     |
| =    | vector        | vector         | boolean     | dictionary order comparsion |
| =    | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| <>   | vector        | vector         | boolean     | dictionary order comparsion |
| <>   | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| <    | vector        | vector         | boolean     | dictionary order comparsion |
| <    | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| >    | vector        | vector         | boolean     | dictionary order comparsion |
| >    | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| <=   | vector        | vector         | boolean     | dictionary order comparsion |
| <=   | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| >=   | vector        | vector         | boolean     | dictionary order comparsion |
| >=   | vecf16        | vecf16         | boolean     | dictionary order comparsion |
| <->  | vector        | vector         | real        | squared Euclidean distance  |
| <->  | vecf16        | vecf16         | real        | squared Euclidean distance  |
| <#>  | vector        | vector         | real        | negative dot product        |
| <#>  | vecf16        | vecf16         | real        | negative dot product        |
| <=>  | vector        | vector         | real        | cosine distance             |
| <=>  | vecf16        | vecf16         | real        | cosine distance             |

## List of functions

## List of casts

| Source type | Target type | Implicit? |
| ----------- | ----------- | --------- |
| real[]      | vector      | yes       |
| vector      | real[]      | yes       |

## List of access methods

| Name    | Type  | Description             |
| ------- | ----- | ----------------------- |
| vectors | Index | pgvecto.rs vector index |

## List of operator classes

| AM      | Input type | Operator class | Default? |
| ------- | ---------- | -------------- | -------- |
| vectors | vector     | vector_l2_ops  | no       |
| vectors | vector     | vector_dot_ops | no       |
| vectors | vector     | vector_cos_ops | no       |
| vectors | vecf16     | vecf16_l2_ops  | no       |
| vectors | vecf16     | vecf16_dot_ops | no       |
| vectors | vecf16     | vecf16_cos_ops | no       |

## List of views

| Name                 | Description                                  |
| -------------------- | -------------------------------------------- |
| pg_vector_index_stat | A view provided for vector index statistics. |
