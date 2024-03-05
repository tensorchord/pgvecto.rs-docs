# Comparison with pgvector

This document provides a comprehensive comparison between pgvector and pgvecto.rs. Understanding these differences will help users choose the right solution based on their specific requirements.

## Feature Differences
- Vector Dimension Limit: pgvecto.rs supports vector length up to 65535, while pgvector only support vector length up to 2000
- Filter Support: pgvecto.rs supports VBASE search mode, ensuring precise and complete results even with applied filters and joins. pgvector may produce incomplete results when filters are applied, potentially missing relevant results ([issue](https://github.com/pgvector/pgvector/issues/244)).
    ![vbase](./images/vbase.png)
- Performance: In our benchmark tests, pgvector typically shows superior performance, being approximately 2x faster than pgvecto.rs in most scenarios, and for larger candidate sets, up to 4x faster.
- Quantization and Memory Efficiency: pgvecto.rs supports fp16 vector storage and indexing with 2x memory saving, while pgvector does not support fp16. pgvecto.rs also supports scalar quantization and product quantization.
- Deletion Support: pgvector may return less results than expected when vectors are deleted or updated. pgvecto.rs does not have this issue.
- Async indexing: pgvecto.rs index is built asynchronously by background threads, allowing non-blocking inserts and always ready for new queries. 

## Core Difference: Index Storage
pgvector utilizes the native PostgreSQL storage engine to store vector indexes. In contrast, pgvecto.rs manages index storage and memory independently from PostgreSQL.

### Rationale for Our Approach:
Early in our development, we experimented with PostgreSQL's page storage for the Hierarchical Navigable Small World (HNSW) index but encountered several limitations:

- Parallelization Challenges: PostgreSQL's process model, where each statement corresponds to a single process and the APIs are not thread-safe, is not conducive to parallelism. The index-building process for vector indexes is computation-intensive and benefits from parallelization. Our attempts to parallelize this process were hindered by frequent 'Too many shared buffer locked' errors.

- Write-Ahead Logging (WAL) Amplification: Inserting a 2KB vector can generate over 20KB of WAL. This issue stems from the HNSW algorithm itself, which requires modifying multiple edges for a single point insertion. PostgreSQL records each change separately, leading to significant WAL amplification.

- Lock Contention: Traversing the HNSW graph necessitates locking every edge list during reads and writes. Given the hierarchical nature of HNSW, where higher levels contain fewer points, lock contention is a common bottleneck during index usage.

In response to these challenges, pgvecto.rs adopted a design akin to FreshDiskANN, resembling the Log-Structured Merge (LSM) tree concept. This architecture comprises three components: the writing segment, the growing segment, and the sealed segment. New vectors are initially written to the writing segment. A background process then asynchronously transforms them into the immutable growing segment. Subsequently, the growing segment undergoes a merge with the sealed segment, akin to the compaction process in an LSM tree. This design offers several benefits:

- Non-blocking Insertions: Index modification operations do not impede insertion processes.
- Batched Modifications: Grouping modifications to the HNSW graph improves throughput.
- Elimination of Read-Write Lock Contention: Since sealed segments are immutable, issues related to read-write lock contention are mitigated.

However, this approach is not without drawbacks. Notably, out-of-the-box WAL support for the index is absent. This limitation affects features like Point-in-Time Recovery and Physical Replication for the index. Nonetheless, the robust PostgreSQL ecosystem provides mechanisms for extensions to define their own WAL through a custom WAL resource manager. Implementing this solution demands additional effort but is feasible.

## Rust VS C 

pgvecto.rs is implemented in Rust, diverging from the conventional choice of C for most PostgreSQL extensions. This decision offers multiple advantages:

- Versatility in Index Algorithms: Rust enables the reuse of the indexing algorithm with various vector representations, including fp16, int8, and sparse vectors.
- Optimized Performance: The Rust ecosystem allows us to distribute binaries with compiled SIMD code for common architectures, automatically selecting the optimal version at runtime.
- Development Efficiency and Safety: Rust's emphasis on memory safety and its modern features significantly accelerate development and reduce the likelihood of memory-related bugs.


In conclusion, while both pgvector and pgvecto.rs aim to enhance PostgreSQL's capabilities with vector indexing, their distinct architectural choices and underlying technologies cater to different scenarios and preferences. pgvecto.rs, with its innovative approach and Rust foundation, offers a robust and efficient solution for vector search inside PostgreSQL.
