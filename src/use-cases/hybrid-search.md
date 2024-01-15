# Hybrid Search

We will show you how to use `pgvecto.rs` to implement hybrid search in this section.

## Vector Search and Full Text Search

Postgres provides [full text search](https://www.postgresql.org/docs/current/textsearch-intro.html), based on [the match operator `@@`](https://www.postgresql.org/docs/current/textsearch-intro.html#TEXTSEARCH-MATCHING). It returns true if a `tsvector` (document) matches a `tsquery` (query). It doesn't matter which data type is written first:

```sql
SELECT 'a fat cat sat on a mat and ate a fat rat'::tsvector @@ 'cat & rat'::tsquery;
 ?column?
----------
 t

SELECT 'fat & cow'::tsquery @@ 'a fat cat sat on a mat and ate a fat rat'::tsvector;
 ?column?
----------
 f
```

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

### Merge the two queries

You could normalize the rank of the full text search result and the vector search result, and then merge them together:

```sql
WITH semantic_search AS (
    SELECT id, content, embedding, RANK () OVER (ORDER BY embedding <-> '[7, 8, 9]') AS rank
    FROM items
    ORDER BY embedding <-> '[7, 8, 9]'::vector
    ), 
    full_text_search AS (
    SELECT id, content, embedding, RANK () OVER (ORDER BY ts_rank(to_tsvector('english', content), 'cat & rat'::tsquery) DESC) AS rank
    FROM items
    WHERE to_tsvector('english', content) @@ 'cat & rat'::tsquery
    ORDER BY ts_rank(to_tsvector('english', content), 'cat & rat'::tsquery) DESC
    )
    SELECT 
        COALESCE(semantic_search.id, full_text_search.id) AS id,
        COALESCE(semantic_search.content, full_text_search.content) AS content,
        COALESCE(semantic_search.embedding, full_text_search.embedding) AS embedding,
        COALESCE(1.0 / (1 + semantic_search.rank), 0.0) + COALESCE(1.0 / (1 + full_text_search.rank), 0.0) AS rank
    FROM semantic_search FULL OUTER JOIN full_text_search USING (id)
    ORDER BY rank DESC;
```

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
