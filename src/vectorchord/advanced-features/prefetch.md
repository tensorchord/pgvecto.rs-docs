# Prefetch <badge type="tip" text="since v0.4.0" />

Prefetch dramatically accelerates large dataset operations by loading data from disk into memory cache before it's needed. It minimizes disk I/O latency during queries, transforming slow disk access into lightning-fast memory operations for optimal query performance.

PostgreSQL 17 has introduced a new [streaming I/O API](https://www.postgresql.org/docs/current/release-17.html) for more efficient sequential I/O. Take advantage of it, a sequential scan on a table will be much faster.

## Prefetch Mode 

:::tip
This feature is enabled by default. Any query can be benefit from prefetching with VectorChord `v0.4.0` and later versions.
:::

In VectorChord, we implemented two prefetch methods: A simple one, `prefetch_buffer`, and `read_stream`, which uses the streaming I/O API. Both methods are much faster than the previous behavior, `read_buffer`.

They can be set by [vchordrq.io_rerank](../usage/search#vchordrq-io-rerank) and [vchordrq.io_search](../usage/search#vchordrq-io-search):

| Prefetch Mode   | Description                                                  | Supported on PG Version |
| --------------- | ------------------------------------------------------------ | ----------------------- |
| read_stream     | Advanced streaming prefetch by streaming I/O API             | PostgreSQL 17+ only     |
| prefetch_buffer | Simple prefetching using PostgreSQL's buffer prefetch mechanism | Any                     |
| read_buffer     | Basic buffer reading without prefetching                     | Any                     |

If you are using PostgreSQL 16 or an earlier version, the `prefetch_buffer` can also help you.

Furthermore, the [Asynchronous I/O](https://pganalyze.com/blog/postgres-18-async-io) that will be introduced in PostgreSQL 18 will make `read_stream` more advantageous.

---

Based on our experimental results, the first query latency can be reduced by 2-3 times with prefetch:

<img src="../images/first_query.png" alt="Prefetch modes" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

See also: [Indexing Prewarm](./cold-start-optimization#indexing-prewarm)