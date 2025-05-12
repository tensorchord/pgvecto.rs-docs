# Benchmark with Elasticsearch

Here we present a comprehensive benchmark comparing our implementation of VectorChord-BM25 with ElasticSearch, focusing on two key metrics: QPS (Queries Per Second) and NDCG@10 (Normalized Discounted Cumulative Gain at rank 10). If you are interested in the details of our implementation, please refer to our blog [VectorChord-BM25: Revolutionize PostgreSQL Search with BM25 Ranking — 3x Faster Than ElasticSearch](https://blog.vectorchord.ai/vectorchord-bm25-revolutionize-postgresql-search-with-bm25-ranking-3x-faster-than-elasticsearch).

## RPS

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1740189817247/5a81c020-1aa2-452d-8e8d-b9653c5b3489.png?auto=compress,format&format=webp" alt="RPS" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

We compare the Top1000 Queries Per Second (QPS)—a metric that measures how many queries a system can process per second while retrieving the top 1000 results for each query—between our implementation and ElasticSearch across various datasets from [bm25-benchmarks](https://github.com/xhluca/bm25-benchmarks). On average, our implementation achieves **3 times higher QPS** compared to ElasticSearch across the tested datasets, showcasing its efficiency and scalability.

## NDCG@10

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1740190423528/10f75122-34fc-4fa2-bb66-3e26e09516ec.png?auto=compress,format&format=webp" alt="NDCG@10" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

We have dedicated substantial effort to align VectorChord-BM25 with ElasticSearch’s behavior, ensuring a fair and precise comparison. As demonstrated in the table, our implementation achieves NDCG@10 scores that are comparable across most datasets, with certain cases even surpassing ElasticSearch (e.g., trec-covid and scifact).