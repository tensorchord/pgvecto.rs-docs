# Prefetch <badge type="tip" text="since v0.4.0" />

Prefetch dramatically accelerates queries that involve I/O operations. It works by proactively reading buffers into operating system page cache or PostgreSQL's buffer pool based on the actual needs of the index.

Prefetch helps overlap I/O with computation, as well as I/O with other I/O operations, significantly reducing the time spent waiting for buffers during query execution, thereby improving overall query performance.

:::tip
This feature is enabled by default. Any query can benefit from prefetching with VectorChord `0.4.0` and later versions.
:::

Prior to version `0.4.0`, VectorChord used PostgreSQL's synchronous I/O interface. Since then, VectorChord utilizes asynchronous I/O interface on newer versions of PostgreSQL. The I/O interface used by VectorChord can be controlled via GUC parameters.

In the GUC parameters, the synchronous I/O interface is referred to as `read_buffer`, the asynchronous I/O interface as `read_stream`, and VectorChord's simulated asynchronous interface as `prefetch_buffer`.

For indexes much smaller than the memory, there is almost no difference among the three prefetch modes. `read_stream` accelerates all disk-based indexes; however, it is only available on PostgreSQL 17 and 18. To address this, VectorChord provides a simulated asynchronous I/O interface called `prefetch_buffer`, which is available on all PostgreSQL versions as a fallback for older versions. `prefetch_buffer` is less effective than `read_stream`.

| Prefetch Mode     | Description                                                                                      | Supported PostgreSQL Versions |
| ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| `read_stream`     | Asynchronous I/O interface in PostgreSQL                                                         | PostgreSQL 17, 18             |
| `prefetch_buffer` | VectorChord's simulated asynchronous I/O interface used as fallback on older PostgreSQL versions | PostgreSQL 14, 15, 16, 17, 18 |
| `read_buffer`     | Synchronous I/O interface in PostgreSQL                                                          | PostgreSQL 14, 15, 16, 17, 18 |

To fully leverage this feature with `read_stream`, you need to enable asynchronous I/O on PostgreSQL 18. See also [PostgreSQL Tuning](performance-tuning#asynchronous-i-o).

## Reference

### Search Parameters <badge type="info" text="vchordrq" />

#### `vchordrq.io_search` <badge type="tip" text="since v0.4.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading bit vectors in vector search, which can impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17, 18: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17, 18: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.

#### `vchordrq.io_rerank` <badge type="tip" text="since v0.4.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading full precision vectors in vector search, which can significantly impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17, 18: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17, 18: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.

### Search Parameters <badge type="info" text="vchordg" />

#### `vchordg.io_search` <badge type="tip" text="since v0.5.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading bit vectors in vector search, which can impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17, 18: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17, 18: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.

#### `vchordg.io_rerank` <badge type="tip" text="since v0.5.0" />

- Description: This GUC parameter controls the I/O prefetching strategy for reading full precision vectors in vector search, which can significantly impact search performance on disk-based vectors.
- Type: string
- Domain: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `{"read_buffer", "prefetch_buffer"}`
    - PostgreSQL 17, 18: `{"read_buffer", "prefetch_buffer", "read_stream"}`
- Default: Depends on PostgreSQL version
    - PostgreSQL 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17, 18: `read_stream`
- Note:
    - `read_buffer` indicates a preference for `ReadBuffer`.
    - `prefetch_buffer` indicates a preference for both `PrefetchBuffer` and `ReadBuffer`.
    - `read_stream` indicates a preference for `read_stream`.
