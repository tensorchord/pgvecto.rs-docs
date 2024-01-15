# Hybrid Search

We will show you how to use `pgvecto.rs` to implement hybrid search in this section.

## Vector Search and Full Text Search

Postgres provides [full text search](https://www.postgresql.org/docs/current/textsearch-intro.html), based on [the match operator `@@`](https://www.postgresql.org/docs/current/textsearch-intro.html#TEXTSEARCH-MATCHING). It returns true if a `tsvector` (document) matches a `tsquery` (query). It doesn't matter **which data type is written first**:

```sql
SELECT 'a fat cat sat on a mat and ate a fat rat'::tsvector @@ 'cat & rat'::tsquery;
 ?column?
----------
 t

SELECT 'cat & rat'::tsquery @@ 'a fat cat sat on a mat and ate a fat rat'::tsvector;
 ?column?
----------
 t
```

::: tip

As the above example suggests, a `tsquery` is not just raw text, any more than a `tsvector` is. A `tsquery` contains search terms, which must be already-normalized lexemes, and may combine multiple terms using [AND, OR, NOT, and FOLLOWED BY operators](https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY). In this example, the `tsquery` `'cat & rat'` matches the `tsvector` `'a fat cat sat on a mat and ate a fat rat'` because it contains both the terms `'cat'` and `'rat'`.

:::

You could use full text search and vector search together in a single query, with the help of `pgvecto.rs`.

```sql
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  embedding vector(3) NOT NULL -- 3 dimensions
);

INSERT INTO items (content, embedding) VALUES
  ('a fat cat sat on a mat and ate a fat rat', '[1, 2, 3]'),
  ('a fat dog sat on a mat and ate a fat rat', '[4, 5, 6]'),
  ('a thin cat sat on a mat and ate a thin rat', '[7, 8, 9]'),
  ('a thin dog sat on a mat and ate a thin rat', '[10, 11, 12]');
```

You should get the following table:

```
postgres=# select * from items;
 id |                  content                   |  embedding   
----+--------------------------------------------+--------------
  2 | a fat cat sat on a mat and ate a fat rat   | [1, 2, 3]
  3 | a fat dog sat on a mat and ate a fat rat   | [4, 5, 6]
  4 | a thin cat sat on a mat and ate a thin rat | [7, 8, 9]
  5 | a thin dog sat on a mat and ate a thin rat | [10, 11, 12]
(4 rows)
```

Let's search for the items with the word `cat` and `rat` in their content first. We will use full text search to do that. The function `to_tsvector` converts a text to a `tsvector:

```sql
SELECT content, embedding
FROM items
WHERE to_tsvector('english', content) @@ 'cat & rat'::tsquery;
```

::: tip

`to_tsvector` parses a textual document into tokens, reduces the tokens to lexemes, and returns a tsvector which lists the lexemes together with their positions in the document.

```sql
SELECT to_tsvector('english', 'a fat  cat sat on a mat - it ate a fat rats');
                  to_tsvector
-----------------------------------------------------
 'ate':9 'cat':3 'fat':2,11 'mat':7 'rat':12 'sat':4
```

In the example above we see that the resulting tsvector does not contain the words `a`, on, or `it`, the word `rats` became `rat`, and the punctuation sign - was ignored, because of the text search configuration is set to `english`.

:::

We should get the following result:

```
                  content                   | embedding 
--------------------------------------------+-----------
 a fat cat sat on a mat and ate a fat rat   | [1, 2, 3]
 a thin cat sat on a mat and ate a thin rat | [7, 8, 9]
(2 rows)
```

Then we will sort the result by the distance between the embedding of each item and the embedding of the query. We will use vector search to do that:

```sql
SELECT content, embedding
FROM items
WHERE to_tsvector('english', content) @@ 'cat & rat'::tsquery
ORDER BY embedding <-> '[7, 8, 9]'::vector;
```

We will get the item with the embedding `[7, 8, 9]` first, and the item with the embedding `[1, 2, 3]` second:

```
                  content                   | embedding 
--------------------------------------------+-----------
 a thin cat sat on a mat and ate a thin rat | [7, 8, 9]
 a fat cat sat on a mat and ate a fat rat   | [1, 2, 3]
(2 rows)
```

### Advanced search: Merge the results of full text search and vector search

You could normalize the rank of the full text search result and the vector search result, and then merge them together:

```sql{2,9,20}
-- The query starts with a Common Table Expression (CTE), named "semantic_search".
WITH semantic_search AS (
    SELECT id, content, embedding, 
    RANK () OVER (ORDER BY embedding <-> '[7, 8, 9]') AS rank
    FROM items
    ORDER BY embedding <-> '[7, 8, 9]'::vector
    ), 
-- Another CTE, named "full_text_search", is defined.
    full_text_search AS (
    SELECT id, content, embedding, 
    RANK () OVER (ORDER BY 
        ts_rank(to_tsvector('english', content), 
            'cat & rat'::tsquery) DESC) AS rank
    FROM items
    WHERE to_tsvector('english', content) @@ 'cat & rat'::tsquery
    ORDER BY ts_rank(
        to_tsvector('english', content), 'cat & rat'::tsquery) DESC
    )
-- The main query selects columns from both CTEs.
    SELECT 
        COALESCE(semantic_search.id, full_text_search.id) AS id,
        COALESCE(semantic_search.content, full_text_search.content) AS content,
        COALESCE(semantic_search.embedding, full_text_search.embedding) AS embedding,
        COALESCE(1.0 / (1 + semantic_search.rank), 0.0) + 
        COALESCE(1.0 / (1 + full_text_search.rank), 0.0) AS rank
    FROM semantic_search FULL OUTER JOIN full_text_search USING (id)
    ORDER BY rank DESC;
```

::: tip

The SQL query performs a combined semantic search and full-text search on "items" and retrieves the results based on their relevance scores. Here's a breakdown of the query:

- The query starts with a [Common Table Expression (CTE)](https://www.postgresql.org/docs/current/queries-with.html) named "semantic_search." It selects columns "id," "content," "embedding," and calculates the rank using the "<->" operator, which measures the distance between the "embedding" column and the vector '[7, 8, 9]'. The results are ordered by the rank.
- Another CTE named "full_text_search" is defined. It selects the same columns as the previous CTE but calculates the rank using the "ts_rank" function with a full-text search query. The 'to_tsvector' function converts the "content" column into a tsvector, and the 'tsquery' 'cat & rat' matches rows containing both "cat" and "rat" in the "content" column. The results are ordered by the rank.
- The main query selects columns from both CTEs using the [`COALESCE`](https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-COALESCE-NVL-IFNULL) function to handle cases where one CTE may have null values. It also calculates the overall rank by summing the reciprocal of the ranks from each CTE.
- The main query performs a FULL OUTER JOIN between the two CTEs on the "id" column.
- The final result is ordered by the overall rank in descending order.

:::

In this query, we first calculate the rank of the full text search result and the vector search result separately. Then we merge the two results together. We will get the following result:

```
 id |                  content                   |  embedding   |          rank          
----+--------------------------------------------+--------------+------------------------
  4 | a thin cat sat on a mat and ate a thin rat | [7, 8, 9]    | 1.00000000000000000000
  2 | a fat cat sat on a mat and ate a fat rat   | [1, 2, 3]    | 0.70000000000000000000
  3 | a fat dog sat on a mat and ate a fat rat   | [4, 5, 6]    | 0.33333333333333333333
  5 | a thin dog sat on a mat and ate a thin rat | [10, 11, 12] | 0.33333333333333333333
(4 rows)
```
