# Roadmap

:::warning
We strongly suggest you explore our new [VectorChord](https://github.com/tensorchord/VectorChord/) implementation, offering enhanced stability and performance. Users are advised to transition to VectorChord. Refer to the [migration guide](/vectorchord/admin/migration) for assistance.
:::

## Midterm Plan

### Sparse Vector Support

Sparse vectors have shown excellent performance in tasks such as RAG and text retrieval, and can improve the results of dense vectors. Therefore, we plan to support sparse vector indexing.

### Better support for streaming workloads

As a database, it is important to support flexible insertion and deletion of vector data. However, the current mainstream algorithm HNSW does not have good support for deletion because it requires rebuilding the index. Therefore, we plan to follow the DiskANN article and support the Vamana algorithm. The Vamana algorithm is an incremental indexing algorithm based on Graph that can support deletion and insertion of vectors without rebuilding the index.

### More vectors on a single machine

Supporting more vectors under the same resources is very important for users to save costs. Currently, we have supported users to store vectors in fp16 format, which requires only half of the memory and space with little loss of accuracy. We also plan to support more vector formats, such as fp8 and int8, to further reduce storage and memory consumption. At the same time, we are also exploring SSD-based vector indexing algorithms such as DiskANN.

### Physical and Streaming Replication 

pgvecto.rs is currently an independent storage system separate from PostgreSQL, managing index memory and storage on its own. Therefore it doesn't support physical replication out of the box. We plan to implement a custom WAL resource manager to meet the requirements of physical replication and make it easier for users to use replication in PG.


## Longterm plan

### 1B vectors inside PostgreSQL

Our ultimate goal is to support 1 billion vectors in PostgreSQL. However, there are many challenges that need to be overcome to reach this goal. It may be necessary to implement a custom vector storage solution using the table access method, or to use a distributed shard such as Citus. We have not yet explored this area extensively, so interested developers are encouraged to discuss it with us.

## Talk with us

Want to jump in? Welcome discussions and contributions! 

- Chat with us on [💬 Discord](https://discord.gg/KqswhpVgdU)
- Have a look at [`good first issue 💖`](https://github.com/tensorchord/pgvecto.rs/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue+%E2%9D%A4%EF%B8%8F%22) issues!
- More on [contributing page](./contributing.md)

These items are not essential for an MVP, but are a part of our longer term plans. Feel free to jump in on these if you're interested!

To be added in the future.
