# Citus

`citus` is a PostgreSQL extension that turns Postgres into a distributed database. `pgvecto.rs` works well with `citus` Here are the steps to enable vector search in a distributed PostgreSQL instance.

`citus` can works on [Single-Node](https://docs.citusdata.com/en/latest/installation/single_node.html) and [Multi-Node](https://docs.citusdata.com/en/latest/installation/multi_node.html), both of which are compatible with `pgvecto.rs` natively.

## Single-Node Citus

First, prepare the dockerfile with `pgvecto.rs` and `citus` installed and attach them to PostgreSQL.

::: details
`citus` must be placed first in `shared_preload_libraries` due to its restrictions.
:::

```dockerfile
FROM tensorchord/pgvecto-rs-binary:pg16-v0.3.0-amd64 as binary

FROM postgres:16
COPY --from=binary /pgvecto-rs-binary-release.deb /tmp/vectors.deb
RUN apt-get update && apt-get install -y curl
RUN apt-get install -y /tmp/vectors.deb && rm -f /tmp/vectors.deb
RUN curl https://install.citusdata.com/community/deb.sh -o deb.sh
RUN bash deb.sh 
RUN apt-get install -y postgresql-16-citus-12.1

CMD ["postgres", "-c" ,"shared_preload_libraries=citus,vectors.so", "-c", "search_path=\"$user\", public, vectors"]
```

Then we will build a Docker image called `citus-vector:16` locally.

::: warning
Don't use `POSTGRES_HOST_AUTH_METHOD: "trust"` in production, see `citus` notes about [Increasing Worker Security](https://docs.citusdata.com/en/latest/admin_guide/cluster_management.html#worker-security) for detailed authentication configure.
:::

```shell
docker build -t citus-vector:16 .
docker run --name citus-single -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 -d citus-vector:16
```

To enable the essential extensions, connect our container with `psql` and execute SQL command.

```sql
-- psql -h 127.0.0.1 -d postgres -U postgres -w
CREATE EXTENSION IF NOT EXISTS citus;
CREATE EXTENSION IF NOT EXISTS vectors;
```

Once the extensions are created, you can create a simple table, then transform it into a [distributed table](https://docs.citusdata.com/en/latest/get_started/tutorial_multi_tenant.html#distributing-tables-and-loading-data).

```sql
CREATE TABLE items (id bigserial, embedding vector(3), category_id bigint, PRIMARY KEY (id, category_id));
SET citus.shard_count = 4;
SELECT create_distributed_table('items', 'category_id');
```

The [index build](../usage/indexing) and [vector search](../usage/search) is as same as before. Tables and indexes are distributed to all shards/workers automatically.

```sql
INSERT INTO items (embedding, category_id)
SELECT '[1, 1, 1]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000)
UNION ALL
SELECT '[1, 2, 3]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000)
UNION ALL
SELECT '[3, 2, 1]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000);
CREATE INDEX ON items USING vectors (embedding vector_cos_ops) WITH (options = "[indexing.hnsw]");
SELECT id FROM items ORDER BY embedding <=> '[1, 1, 1]' LIMIT 100;
```

## Multi-Node Citus

You can use the same Dockerfile and image for Multi-Node `citus` as for [Single-Node Citus](#single-node-citus).
In this example, we will start a cluster of 1 coordinator node and 2 worker nodes with docker compose.

::: warning
Don't use `POSTGRES_HOST_AUTH_METHOD: "trust"` in production, see `citus` notes about [Increasing Worker Security](https://docs.citusdata.com/en/latest/admin_guide/cluster_management.html#worker-security) for detailed authentication configure.
:::

```yaml
services:
  main:
    container_name: main
    image: 'citus-vector:16'
    ports:
      - "5432:5432"
    environment:
      POSTGRES_HOST_AUTH_METHOD: "trust"
  worker1:
    container_name: worker1
    image: 'citus-vector:16'
    ports:
      - "5431:5432"
    environment:
      POSTGRES_HOST_AUTH_METHOD: "trust"
  worker2:
    container_name: worker2
    image: 'citus-vector:16'
    ports:
      - "5430:5432"
    environment:
      POSTGRES_HOST_AUTH_METHOD: "trust"
```

Now start all containers with docker-compose. Each container is a `citus` node, with 1 coordinator(main) and 2 workers.

```shell
docker compose up -d
```

As before, you'll want to enable the extensions, but make sure you run the command on all nodes.

```shell
psql -h 127.0.0.1 -d postgres -U postgres -w -c 'CREATE EXTENSION IF NOT EXISTS citus;CREATE EXTENSION IF NOT EXISTS vectors;'
psql -h 127.0.0.1 -d postgres -U postgres -w -p 5431 -c 'CREATE EXTENSION IF NOT EXISTS citus;CREATE EXTENSION IF NOT EXISTS vectors;'
psql -h 127.0.0.1 -d postgres -U postgres -w -p 5430 -c 'CREATE EXTENSION IF NOT EXISTS citus;CREATE EXTENSION IF NOT EXISTS vectors;'
```

To inform the coordinator about its workers, connect to the coordinator node with `psql` and register the two workers.

```sql
-- psql -h 127.0.0.1 -d postgres -U postgres -w
SELECT citus_set_coordinator_host('main', 5432);
SELECT * from citus_add_node('worker1', 5432);
SELECT * from citus_add_node('worker2', 5432);
```

Finally, you can perform vector queries in the same way as in [Single-Node Citus](#single-node-citus).
```sql
CREATE TABLE items (id bigserial, embedding vector(3), category_id bigint, PRIMARY KEY (id, category_id));
SET citus.shard_count = 4;
SELECT create_distributed_table('items', 'category_id');
INSERT INTO items (embedding, category_id) 
SELECT '[1, 1, 1]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000)
UNION ALL
SELECT '[1, 2, 3]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000)
UNION ALL
SELECT '[3, 2, 1]'::vector, FLOOR(random() * 100) FROM generate_series(1, 1000);
CREATE INDEX ON items USING vectors (embedding vector_cos_ops) WITH (options = "[indexing.hnsw]");
SELECT id FROM items ORDER BY embedding <-> '[1, 1, 1]' LIMIT 100;
```

## Monitor

If you're using a `citus` distributed table, the `pg_vector_index_stat` view on the coordinator will be empty. Since all the indexes are created at the workers actually, we can only inspect the vector status by distributing this view to the workers.

```sql
SELECT * from run_command_on_workers($$ SELECT (to_json(array_agg(pg_vector_index_stat .*))) FROM pg_vector_index_stat $$);
```