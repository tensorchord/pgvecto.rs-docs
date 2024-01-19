# Roadmap

## Midterm plan

### Sparse Vector Support

Sparse vectors have shown excellent performance in tasks such as RAG and text retrieval, and can improve the results of dense vectors. Therefore, we plan to support indexing of sparse vectors.

### Better Streaming workdload support

As a database, it is important to support flexible insertion and deletion of vector data. However, the current mainstream algorithm HNSW does not have good support for deletion because it requires rebuilding the index. Therefore, we plan to refer to the article on DiskANN and support the Vamana algorithm. The Vamana algorithm is an incremental indexing algorithm based on Graph, which can support vector deletion and insertion without rebuilding the index.

### More vectors on the single machine

Supporting more vectors under the same resources is very important for users to save costs. Currently, we have supported users to store vectors in fp16 format, which only requires half of the storage and memory with minor loss of accuracy. We also plan to support more vector formats, such as fp8 and int8, to further reduce storage and memory usage. At the same time, we are also exploring SSD-based vector indexing algorithms, such as DiskANN.

### Physical Replication and Streaming Replication 

pgvecto.rs is currently an independent storage system separate from PostgreSQL, managing index memory and storage on its own. Therefore, it doesn't support physical replication out of the box. We plan to implement a Custom WAL Resource Manager to meet the requirements of physical replication and simplify the difficulty for users to utilize replication in PG. 

## Longterm plan

### 1B vectors inside PostgreSQL

Our ultimate goal is to support 1 billion vectors in PostgreSQL. However, there are numerous challenges that need to be overcome in order to achieve this objective. It may be necessary to implement a custom storage solution for vectors using the table access method or utilize a distributed shard like Citus. We have not extensively explored this area yet, so developers who are interested are encouraged to discuss it with us.

## Talk with us

Want to jump in? Welcome discussions and contributions! 

- Chat with us on [💬 Discord](https://discord.gg/KqswhpVgdU)
- Have a look at [`good first issue 💖`](https://github.com/tensorchord/pgvecto.rs/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue+%E2%9D%A4%EF%B8%8F%22) issues!
- More on [contributing page](./contributing.md)

These items are not essential for an MVP, but are a part of our longer term plans. Feel free to jump in on these if you're interested!

To be added in the future.
