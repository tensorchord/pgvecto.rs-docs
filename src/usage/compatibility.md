# `pgvector` compatibility

`pgvecto.rs` is natively compatible with `pgvector` at:
* `CREATE TABLE` commands, for instance, `CREATE TABLE t (val vector(3))`
* `INSERT INTO` commands, for instance, `INSERT INTO t (val) VALUES ('[0.6,0.6,0.6]')`

`pgvecto.rs` can be configured to be compatible with `pgvector` at: 
* Index options, which allows you to create index by `USING hnsw (val vector_ip_ops)`
* Query options, which can be set by `SET ivfflat.probes = 10`

This feature is named `pgvector` compatibility. 
It can be enabled by `SET vectors.pgvector_compatibility = on`.

## Index Options & Query Options

For index `ivfflat` and `hnsw` only the following options are available.

* Default value for index options is **different from pgvecto.rs original**, which keeps the same as in `pgvector`.
* Default value for query options is the same as in `pgvecto.rs`.

Index options for `ivfflat`:

| Key   | Type    | Default | Description               |
| ----- | ------- | ------- | ------------------------- |
| lists | integer | `100`   | Number of cluster units.  |

Query options for `ivfflat`:

| Option           | Type                     | Default | Description                               |
| ---------------- | ------------------------ | ------- | ----------------------------------------- |
| ivfflat.probes   | integer (`[1, 1000000]`) | `10`    | Number of lists to scan.                  |

::: warning
Default value of `ivfflat.probes` is `10` instead of `1` from pgvector.
:::

Index options for `hnsw`:

| key             | type    | default | description                      |
| --------------- | ------- | ------- | -------------------------------- |
| m               | integer | `16`    | Maximum degree of the node.      |
| ef_construction | integer | `64`    | Search extent in construction.   |

Query options for `hnsw`:

| Option         | Type                     | Default | Descrcompatibilitymodeiption                               |
| -------------- | ------------------------ | ------- | ----------------------------------------- |
| hnsw.ef_search | integer (`[1, 65535]`)   | `100`   | Search scope of HNSW.                     |

::: warning
Default value for `hnsw.ef_search` is `100` instead of `40` from pgvector.
:::

## Examples

It's easy to enable pgvector compatibility and start a vector query.
```sql
DROP TABLE IF EXISTS t;
SET vectors.pgvector_compatibility=on;
SET hnsw.ef_search=40;
CREATE TABLE t (val vector(3));
INSERT INTO t (val) SELECT ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 1000);
CREATE INDEX hnsw_cos_index ON t USING hnsw (val vector_cosine_ops);
SELECT COUNT(1) FROM (SELECT 1 FROM t ORDER BY val <-> '[0.5,0.5,0.5]' limit 100) t2;
DROP INDEX hnsw_cos_index;
```

Multiply types of indexes are accepted:
```sql
SET vectors.pgvector_compatibility=on;
SET hnsw.ef_search=40;
-- [hnsw + vector_l2_ops] index with default options
CREATE INDEX hnsw_l2_index ON t USING hnsw (val vector_l2_ops);
-- [hnsw + vector_cosine_ops] index with single ef_construction option
CREATE INDEX hnsw_cosine_index ON t USING hnsw (val vector_cosine_ops) WITH (ef_construction = 80);
-- anonymous [hnsw + vector_ip_ops] with all options
CREATE INDEX ON t USING hnsw (val vector_ip_ops) WITH (ef_construction = 80, m = 12);
SET ivfflat.probes=1;
-- [ivfflat + vector_l2_ops] index with default options
CREATE INDEX ivfflat_l2_index ON t USING ivfflat (val vector_l2_ops);
-- [ivfflat + vector_ip_ops] index with all options
CREATE INDEX ivfflat_ip_index ON t USING ivfflat (val vector_cosine_ops) WITH (nlist = 80);
-- anonymous [ivf + vector_ip_ops] with all options
CREATE INDEX ON t USING ivfflat (val vector_ip_ops) WITH (lists = 80)
```