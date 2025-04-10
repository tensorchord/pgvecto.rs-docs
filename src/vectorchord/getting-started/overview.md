# Overview

VectorChord (vchord) is a PostgreSQL extension designed for scalable, high-performance, and disk-efficient vector similarity search.

With VectorChord, you can store 400,000 vectors for just $1, enabling significant savings: 6x more vectors compared to Pinecone's optimized storage and 26x more than pgvector/pgvecto.rs for the same price[^1]. For further insights, check out our [launch blog post](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql).

## Features

VectorChord introduces remarkable enhancements over pgvecto.rs and pgvector:

**⚡ Enhanced Performance**: Delivering optimized operations with up to 5x faster queries, 16x higher insert throughput, and 16x quicker[^1] index building compared to pgvector's HNSW implementation.

[^1]: Based on [MyScale Benchmark](https://myscale.github.io/benchmark/#/) with 768-dimensional vectors and 95% recall. Please checkout our [blog post](https://blog.vectorchord.ai/vectorchord-store-400k-vectors-for-1-in-postgresql) for more details.

**💰 Affordable Vector Search**: Query 100M 768-dimensional vectors using just 32GB of memory, achieving 35ms P50 latency with top10 recall@95%, helping you keep infrastructure costs down while maintaining high search quality.

**🔌 Seamless Integration**: Fully compatible with pgvector data types and syntax while providing optimal defaults out of the box - no manual parameter tuning needed. Just drop in VectorChord for enhanced performance.

**🔧 Accelerated Index Build**: Leverage IVF to build indexes externally (e.g., on GPU) for faster KMeans clustering, combined with RaBitQ[^2] compression to efficiently store vectors while maintaining search quality through autonomous reranking.

[^2]: Gao, Jianyang, and Cheng Long. "RaBitQ: Quantizing High-Dimensional Vectors with a Theoretical Error Bound for Approximate Nearest Neighbor Search." Proceedings of the ACM on Management of Data 2.3 (2024): 1-27.

**📏 Long Vector Support**: Store and search vectors up to 60,000[^3] dimensions, enabling the use of the best high-dimensional models like text-embedding-3-large with ease.

[^3]: There is a [limitation](https://github.com/pgvector/pgvector#vector-type) at pgvector of 16,000 dimensions now. If you really have a large dimension(`16,000<dim<60,000`), consider changing [VECTOR_MAX_DIM](https://github.com/pgvector/pgvector/blob/fef635c9e5512597621e5669dce845c744170822/src/vector.h#L4) and compile pgvector yourself.

**🌐 Scale As You Want**: Based on horizontal expansion, the query of 5M / 100M 768-dimensional vectors can be easily scaled to 10000+ QPS with top10 recall@90% at a competitive cost[^4]

[^4]: Please check our [blog post](https://blog.vectorchord.ai/vector-search-at-10000-qps-in-postgresql-with-vectorchord)  for more details, the PostgreSQL scalability is powered by [CloudNative-PG](https://github.com/cloudnative-pg/cloudnative-pg).

## Quick Start

For new users, we recommend using the Docker image to get started quickly. If you do not prefer Docker, please read [installation guide](./installation) for other installation methods.

```bash
docker run \
  --name vectorchord-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/vchord-postgres:pg17-v0.2.2
```
> In addition to the base image with the VectorChord extension, we provide an all-in-one image, `tensorchord/vchord-suite:pg17-latest`. This comprehensive image includes all official TensorChord extensions. Developers should select an image tag that is compatible with their extension's version, as indicated in [the support matrix](https://github.com/tensorchord/VectorChord-images?tab=readme-ov-file#support-matrix).

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```bash
psql -h localhost -p 5432 -U postgres
```

Now you can play with VectorChord!

VectorChord depends on pgvector, including the vector representation. Since you can use them directly, your application can be easily migrated without pain!

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

Similar to pgvector, you can create a table with vector column and insert some rows to it.

```sql
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
INSERT INTO items (embedding) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
```

With VectorChord, you can create `vchordrq` indexes.

```SQL
CREATE INDEX ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = []
$$);
```

And then perform a vector search using `SELECT ... ORDER BY ... LIMIT ...`.

```SQL
SET vchordrq.probes TO '';
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

For more usage, please read:

* [Indexing](../usage/indexing)
* [Performance Tuning](../usage/performance-tuning)
* [Advanced Features](../usage/advanced-features)

## License

This software is licensed under a dual license model:

1. **GNU Affero General Public License v3 (AGPLv3)**: You may use, modify, and distribute this software under the terms of the AGPLv3.

2. **Elastic License v2 (ELv2)**: You may also use, modify, and distribute this software under the Elastic License v2, which has specific restrictions.

You may choose either license based on your needs. We welcome any commercial collaboration or support, so please email us <vectorchord-inquiry@tensorchord.ai> with any questions or requests regarding the licenses.
