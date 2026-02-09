# Similarity Filter

Usually, `ORDER BY` and `LIMIT` clauses are used to perform vector search. In some cases, you may want to use a `WHERE` clause to filter out vectors that are far from the query. Naturally, you might write the following SQL.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <-> '[0, 0, 0]' < 0.1 ORDER BY embedding <-> '[0, 0, 0]' LIMIT 10;
                                  QUERY PLAN                                   
-------------------------------------------------------------------------------
 Limit
   ->  Index Scan using items_embedding_idx on items
         Order By: (embedding <-> '[0,0,0]'::vector)
         Filter: ((embedding <-> '[0,0,0]'::vector) < '0.1'::double precision)
```

The returned results meet expectations, while this approach suffers from poor performance. This is because if fewer than $10$ vectors fall within the distance threshold, PostgreSQL forces the index to continue to search to get $10$ results, exhausting the entire search space.

To avoid this situation, you can use specific syntax to push the filter down to the vector index, allowing it to stop the search as soon as the search region moves beyond the specified distance. We refer to this type of distance-based condition that can be pushed down to the index as a *similarity filter*.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <<->> sphere('[0, 0, 0]'::vector, 0.1) ORDER BY embedding <-> '[0, 0, 0]' LIMIT 10;
                               QUERY PLAN                               
------------------------------------------------------------------------
 Limit
   ->  Index Scan using items_embedding_idx on items
         Index Cond: (embedding <<->> '("[0,0,0]",0.1)'::sphere_vector)
         Order By: (embedding <-> '[0,0,0]'::vector)
```

`embedding <<->> sphere('[0, 0, 0]'::vector, 0.1)` evaluates to `true` if and only if the L2 distance between the two vectors is less than `0.1`. Use the `<<#>>` operator for negative inner product, and the `<<=>>` operator for cosine distance.

Additionally, if you specify only the `WHERE` clause without an `ORDER BY`, the index can still be used effectively.

```sql
EXPLAIN (COSTS FALSE) 
SELECT * FROM items WHERE embedding <<->> sphere('[0, 0, 0]'::vector, 0.1);
                            QUERY PLAN                            
------------------------------------------------------------------
 Index Scan using items_embedding_idx on items
   Index Cond: (embedding <<->> '("[0,0,0]",0.1)'::sphere_vector)
```

## Reference

### Operator Classes

Refer to

* [Operator Classes (`vchordrq`)](indexing#operator-classes).
* [Operator Classes (`vchordg`)](graph-index#operator-classes).

### Types

#### `sphere_vector`

- Description: A sphere.
- Definition: `(center vector, radius REAL)`.

#### `sphere_halfvec`

- Description: A sphere.
- Definition: `(center halfvec, radius REAL)`.

#### `sphere_rabitq8` <badge type="tip" text="since v1.1.0" />

- Description: A sphere.
- Definition: `(center rabitq8, radius REAL)`.

#### `sphere_rabitq4` <badge type="tip" text="since v1.1.0" />

- Description: A sphere.
- Definition: `(center rabitq4, radius REAL)`.

### Functions

#### `sphere(vector, real)`

- Description: Create a sphere by its center and radius.
- Definition: `SELECT ROW($1, $2)`.
- Result: `sphere_vector`
- Arguments:
    - `vector`, the center of the sphere
    - `real`, the radius of sphere
- Example:
    - `SELECT sphere('[0,0,0]'::vector, 1.0)`

#### `sphere(halfvec, real)`

- Description: Create a sphere by its center and radius.
- Definition: `SELECT ROW($1, $2)`.
- Result: `sphere_halfvec`
- Arguments:
    - `halfvec`, the center of the sphere
    - `real`, the radius of sphere
- Example:
    - `SELECT sphere('[0,0,0]'::halfvec, 1.0)`

#### `sphere(rabitq8, real)` <badge type="tip" text="since v1.1.0" />

- Description: Create a sphere by its center and radius.
- Definition: `SELECT ROW($1, $2)`.
- Result: `sphere_rabitq8`
- Arguments:
    - `rabitq8`, the center of the sphere
    - `real`, the radius of sphere
- Example:
    - `SELECT sphere(quantize_to_rabitq8('[0,0,0]'::vector), 1.0)`

#### `sphere(rabitq4, real)` <badge type="tip" text="since v1.1.0" />

- Description: Create a sphere by its center and radius.
- Definition: `SELECT ROW($1, $2)`.
- Result: `sphere_rabitq4`
- Arguments:
    - `rabitq4`, the center of the sphere
    - `real`, the radius of sphere
- Example:
    - `SELECT sphere(quantize_to_rabitq4('[0,0,0]'::vector), 1.0)`

### Operators

#### `<<->>(vector, sphere_vector)`

- Description: Test if the vector lies inside the sphere using the L2 metric.
- Result: boolean
- Arguments:
    - `vector`, the vector to be tested
    - `sphere_vector`, the sphere

#### `<<#>>(vector, sphere_vector)`

- Description: Test if the vector lies inside the sphere using the negative dot product metric.
- Result: boolean
- Arguments:
    - `vector`, the vector to be tested
    - `sphere_vector`, the sphere

#### `<<=>>(vector, sphere_vector)`

- Description: Test if the vector lies inside the sphere using the cosine metric.
- Result: boolean
- Arguments:
    - `vector`, the vector to be tested
    - `sphere_vector`, the sphere

#### `<<->>(halfvec, sphere_halfvec)`

- Description: Test if the vector lies inside the sphere using the L2 metric.
- Result: boolean
- Arguments:
    - `halfvec`, the vector to be tested
    - `sphere_halfvec`, the sphere

#### `<<#>>(halfvec, sphere_halfvec)`

- Description: Test if the vector lies inside the sphere using the negative dot product metric.
- Result: boolean
- Arguments:
    - `halfvec`, the vector to be tested
    - `sphere_halfvec`, the sphere

#### `<<=>>(halfvec, sphere_halfvec)`

- Description: Test if the vector lies inside the sphere using the cosine metric.
- Result: boolean
- Arguments:
    - `halfvec`, the vector to be tested
    - `sphere_halfvec`, the sphere

#### `<<->>(rabitq8, sphere_rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the L2 metric.
- Result: boolean
- Arguments:
    - `rabitq8`, the vector to be tested
    - `sphere_rabitq8`, the sphere

#### `<<#>>(rabitq8, sphere_rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the negative dot product metric.
- Result: boolean
- Arguments:
    - `rabitq8`, the vector to be tested
    - `sphere_rabitq8`, the sphere

#### `<<=>>(rabitq8, sphere_rabitq8)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the cosine metric.
- Result: boolean
- Arguments:
    - `rabitq8`, the vector to be tested
    - `sphere_rabitq8`, the sphere

#### `<<->>(rabitq4, sphere_rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the L2 metric.
- Result: boolean
- Arguments:
    - `rabitq4`, the vector to be tested
    - `sphere_rabitq4`, the sphere

#### `<<#>>(rabitq4, sphere_rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the negative dot product metric.
- Result: boolean
- Arguments:
    - `rabitq4`, the vector to be tested
    - `sphere_rabitq4`, the sphere

#### `<<=>>(rabitq4, sphere_rabitq4)` <badge type="tip" text="since v1.1.0" />

- Description: Test if the vector lies inside the sphere using the cosine metric.
- Result: boolean
- Arguments:
    - `rabitq4`, the vector to be tested
    - `sphere_rabitq4`, the sphere
