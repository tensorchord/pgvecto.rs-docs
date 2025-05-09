# Supercharge vector search with ColBERT rerank in PostgreSQL

Traditional vector search methods typically employ sentence embeddings to locate similar content. However, generating sentence embeddings through pooling token embeddings can potentially sacrifice fine-grained details present at the token level. [ColBERT](https://github.com/stanford-futuredata/ColBERT) overcomes this by representing text as token-level multi-vectors rather than a single, aggregated vector. This approach, leveraging contextual late interaction at the token level, allows ColBERT to retain more nuanced information and improve search accuracy compared to methods relying solely on sentence embeddings.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1736414634494/e50e0b90-74da-49d9-813d-5c5ec00317ee.jpeg" alt="ColBERT structure (from the original paper)" width="600" height="400" />

As illustrated in the above image, ColBERT encodes each document/query into a list of token vectors and computes the MaxSim during the query time.

Token-level late interaction requires more computing power and storage. This makes using ColBERT search in large datasets challenging, especially when low latency is important.

One possible solution is to combine sentence-level vector search with token-level late interaction rerank, which leverages the efficiency of approximate vector search and the high quality of multi-vector similarity search.

The multi-vector approach is not limited to pure text retrieval tasks; it can also be used in visual document understanding. For multimodal retrieval models, state-of-the-art models like [ColPali](https://huggingface.co/vidore/colpali-v1.3) and [ColQwen](https://huggingface.co/vidore/colqwen2-v1.0-merged) directly encode document images into multi-vectors and demonstrate stronger performance compared to OCR-to-text approaches.

This blog will demonstrate using the PostgreSQL extension [VectorChord](https://github.com/tensorchord/VectorChord/) and pgvector with ColBERT rerank.

## Tutorial

Assume we already have the documents, let’s create a table to store all of them:

```python
import psycopg
from pgvector.psycopg import register_vector

class PgClient:
    def __init__(self, url: str, dataset: str, sentence_emb_dim: int, token_emb_dim: int):
        self.dataset = dataset
        self.sentence_emb_dim = sentence_emb_dim
        self.token_emb_dim = token_emb_dim
        self.conn = psycopg.connect(url, autocommit=True)
        with self.conn.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vchord CASCADE;")
        register_vector(self.conn)

    def create(self):
        with self.conn.cursor() as cursor:
            cursor.execute(
                f"CREATE TABLE IF NOT EXISTS {self.dataset}_corpus "
                "(id INT BY DEFAULT AS IDENTITY PRIMARY KEY, text TEXT, "
                f"emb vector({self.sentence_emb_dim}), embs vector({self.token_emb_dim})[]);"
            )
```

Here we created a table with sentence-level embedding and token-level embeddings.

There are numerous embedding APIs and [open-source models](https://huggingface.co/spaces/mteb/leaderboard). You can choose the one that fits your use case.

For token-level embedding:

```python
from colbert.infra import ColBERTConfig
from colbert.modeling.checkpoint import Checkpoint

class TokenEncoder:
    def __init__(self):
        self.config = ColBERTConfig(doc_maxlen=220, query_maxlen=32)
        self.checkpoint = Checkpoint(
            "colbert-ir/colbertv2.0", colbert_config=self.config, verbose=0
        )

    def encode_doc(self, doc: str):
        return self.checkpoint.docFromText([doc], keep_dims=False)[0].numpy()

    def encode_query(self, query: str):
        return self.checkpoint.queryFromText([query])[0].numpy()
```

ColBERT model produces 128-dim vectors by default.

To insert the data:

```python
class PgClient:
    ...
    def insert(self, documents: list[str]):
        with self.conn.cursor() as cursor:
            for doc in tqdm(documents):
                sentence_emb = sentence_encoder.encode_doc(doc)
                token_embs = [emb for emb in token_encoder.encode(doc)]
                cursor.execute(
                    f"INSERT INTO {self.dataset}_corpus (text, emb, embs) VALUES (%s, %s, %s)"
                    (doc, sentence_emb, token_embs)
                )
```

For the vector search part, we can use VectorChord to build a high-performance RaBitQ index:

```python
class PgClient:
    ...
    def index(self, num_doc: int, workers: int):
        n_cluster = 1 << math.ceil(math.log2(num_doc ** 0.5 * 4))
        config = f"""
        residual_quantization = true
        [build.internal]
        lists = [{n_cluster}]
        build_threads = {workers}
        spherical_centroids = false
        """
        with self.conn.cursor() as cursor:
            cursor.execute(f"SET max_parallel_maintenance_workers TO {workers}")
            cursor.execute(f"SET max_parallel_workers TO {workers}")
            cursor.execute(
                f"CREATE INDEX {self.dataset}_rabitq ON {self.dataset}_corpus USING "
                f"vchordrq (emb vector_l2_ops) WITH (options = $${config}$$)"
            )
```

To speed up the indexing building process, we can utilize the external centroids build. Check “[Benefits and Steps of External Centroids Building in VectorChord](https://blog.vectorchord.ai/benefits-and-steps-of-external-centroids-building-in-vectorchord)” for more details.

Now, we can query the PostgreSQL:

```python
class PgClient:
    ...
    def query(self, doc: str, topk: int):
        sentence_emb = sentence_encoder.encode_query(doc)
        with self.conn.cursor() as cursor:
            cursor.execute(
                f"SELECT id, text FROM {self.dataset}_corpus ORDER BY emb <-> %s LIMIT {topk}"
            )
            res = cursor.fetchall()
        return res
```

To support `MaxSim` rerank, we’ll need to create a function:

```python
class PgClient:
    def __init__(self, url: str, dataset: str, sentence_emb_dim: int, token_emb_dim: int):
        ...
        self.conn.execute("""
            CREATE OR REPLACE FUNCTION max_sim(document vector[], query vector[]) RETURNS double precision AS $$
            WITH queries AS (
                SELECT row_number() OVER () AS query_number, * FROM (SELECT unnest(query) AS query)
            ),
            documents AS (
                SELECT unnest(document) AS document
            ),
            similarities AS (
                SELECT query_number, document <=> query AS similarity FROM queries CROSS JOIN documents
            ),
            max_similarities AS (
                SELECT MAX(similarity) AS max_similarity FROM similarities GROUP BY query_number
            )
            SELECT SUM(max_similarity) FROM max_similarities
            $$ LANGUAGE SQL
        """)
```

Now, we can rerank the documents retrieved by vector search:

```python
class PgClient:
    def rerank(self, query: str, ids: list[int], topk: int):
        token_embs = [emb for emb in token_encoder.encode_query(query)]
        with self.conn.cursor() as cursor:
            cursor.execute(
                f"SELECT id, text FROM {self.dataset}_corpus WHERE id = ANY(%s) ORDER BY "
                f"max_sim(embs, %s) DESC LIMIT {topk}"
                (ids, token_embs)
            )
            res = cursor.fetchall()
        return res
```

## Evaluation

We have tested this method on several [BEIR](https://github.com/beir-cellar/beir) datasets. Here are the results:

| Dataset | Search NDCG@10 | Rerank NDCG@10 |
| --- | --- | --- |
| fiqa | 0.23211 | 0.3033 |
| quora | 0.31599 | 0.3934 |

This shows that ColBERT reranking can significantly enhance the results of vector searches.

All the related benchmark codes can be found [here](https://github.com/kemingy/vectorchord-colbert).

## Future work

Vector search and full-text search with ColBERT rerank can further improve performance. We’re also working on the [PostgreSQL BM25 extensions](https://github.com/tensorchord/VectorChord-bm25). Stay tuned.

### References

* [https://www.answer.ai/posts/colbert-pooling.html](https://www.answer.ai/posts/colbert-pooling.html)
    
* [https://github.com/stanford-futuredata/ColBERT](https://github.com/stanford-futuredata/ColBERT)
    
* [https://github.com/tensorchord/vectorChord/](https://github.com/tensorchord/vectorChord/)
    
* [https://github.com/tensorchord/VectorChord-bm25](https://github.com/tensorchord/VectorChord-bm25)
    
* [https://huggingface.co/blog/manu/colpali](https://huggingface.co/blog/manu/colpali)