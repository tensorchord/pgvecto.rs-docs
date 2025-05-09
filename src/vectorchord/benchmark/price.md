# Price Benchmark

Using VectorChord, you can achieve a QPS of 131 with 0.95 precision on 100 million 768-dimensional vectors for the top 10 queries. This setup costs only $250 monthly and can be hosted on a single machine. If you are interested in the details of our implementation, please refer to our blog [VectorChord: Store 400k Vectors for $1 in PostgreSQL](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql).

This means you can store 400k vectors for only $1, allowing you to save significantly: 6x more vectors compared to Pinecone (storage optimized instance) and 26x more than pgvector/pgvecto.rs for the same price.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1733194327962/8b0f2610-af64-4104-98db-7f94416f354e.png" alt="Pricing Benchmark" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

In the monthly cost comparison for storing vectors, based on MyScale benchmark data, the chart highlights how VectorChord emerges as an affordable option, priced at just $247 for storing 100 million vectors. In contrast, Pinecone, despite its optimized storage, costs $1,600 per month, while Qdrant is priced at $4,374. pgvector/pgvecto.rs has a considerably higher cost of $6,580.

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1733194599461/eb1cf21d-4eb0-4427-8b39-bbb96d125182.png" alt="Pricing Benchmark" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

:::tip
The price benchmark is tested on December 5, 2024. We are ongoingly enhancing performance and optimizing costs. For example, VectorChord 0.2 builds on its predecessor with a 30% smaller index size and 50% faster builds. If you want to know the latest benchmark, please contact us at [discord](https://discord.gg/KqswhpVgdU).
:::