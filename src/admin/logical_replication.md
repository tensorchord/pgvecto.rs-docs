# Logical replication

Logical replication is a feature in PostgreSQL that enables the replication of individual database objects or a subset of data from one PostgreSQL database to another.

With logical replication, you can selectively replicate specific tables, databases, or even specific rows based on predefined replication rules. This provides more flexibility compared to physical replication, where the entire database cluster is replicated. It allows you to design custom replication topologies and replicate only the data that is necessary for your use case.

We will show you how to use logical replication to replicate data from one PostgreSQL database to another.

## Deploy source and target PostgreSQL clusters

``` shell
$ echo 'version: "3.7"
services:
  source_db:
    image: tensorchord/pgvecto-rs:pg15-v0.2.0
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password
    command: >
      -c wal_level=logical
      -c shared_preload_libraries=vectors.so
    networks:
      localnet:

  target_db:
    image: tensorchord/pgvecto-rs:pg15-v0.2.0
    ports:
      - "5433:5432"
    environment:
      POSTGRES_PASSWORD: password
    command: >
      -c wal_level=logical
      -c shared_preload_libraries=vectors.so
    networks:
      localnet:

networks:
  localnet:
' > docker-compose.yml

$ docker compose up -d
```

Create extension vectors in source database and target database.

```shell
# create extension vectors
$ psql -h <source_db_ip> -U postgres -p 5432 
DROP EXTENSION IF EXISTS "vectors";
CREATE EXTENSION "vectors";

$ psql -h <target_db_ip> -U postgres -p 5432
DROP EXTENSION IF EXISTS "vectors";
CREATE EXTENSION "vectors";
```

## Configure logical replication

Now, we can set logical replication between source database and target database.

### Prepare test data

We need to create a table named `test` with a column named `embedding` of type `vector(10)` in source database and target database. Then we create an index on the `embedding` column of the `test` table in source database and target database. Finally, we insert data into the source database.

#### Create the table

```sql
DROP TABLE IF EXISTS test;
CREATE TABLE test (id integer PRIMARY KEY, embedding vector(10) NOT NULL);
```

#### Create the index

We create an index on the `embedding` column of the `test` table in source database and target database. The index type is flat, it is a brute force algorithm. We choose `vector_l2_ops` squared Euclidean distance to measure the distance between vectors. Another index type and distance function can be found in [here](https://docs.pgvecto.rs/usage/indexing.html).

```sql
CREATE INDEX ON test USING vectors (embedding vector_l2_ops) WITH (options = "[indexing.flat]");
```

#### Insert data

We only need to insert data into the source database. The data will be synchronized to the target database.

```sql
INSERT INTO test
SELECT i, ARRAY[random(), random(),random(),random(),random(),random(),random(),random(),random()]::real[] 
FROM generate_series(1, 100) i;
```

In source database, now you can search for the nearest neighbor of a vector in the `embedding` column of the `test` table.

```sql
postgres=# SELECT id FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
 id 
----
 82
 69
 80
 22
 31
 20
 85
 97
 72
(10 rows)
```

If you query the target database, you will get the noting:
```sql
SELECT id FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
 id 
----
(0 rows)
```

### Set up logical replication

To simplify the process of setting up logical replication between two PostgreSQL databases, we will use [pg-easy-replicate](https://github.com/shayonj/pg_easy_replicate).

We use [pg-easy-replicate](https://github.com/shayonj/pg_easy_replicate) to set up logical replication between source database and target database.

```shell
# get the network name
$ docker network ls | grep  pg
8631dd77129b   pg_regress_localnet   bridge    local

# get source and target container ip
$ docker inspect <container_id> | grep IP

$ docker run -e SOURCE_DB_URL="postgres://postgres:password@<source_db_ip>:5432/postgres"    -e TARGET_DB_URL="postgres://postgres:password@<target_db_ip>:5432/postgres"   -it --rm --network=<network> shayonj/pg_easy_replicate:latest   pg_easy_replicate config_check
/usr/bin/pg_dump
✅ Config is looking good.
```

### Bootstrap

Every sync will need to be bootstrapped before you can set up the sync between two databases. Bootstrap creates a new super user to perform the orchestration required during the rest of the process. It also creates some internal metadata tables for record keeping.

```shell
$ docker run -e SOURCE_DB_URL="postgres://postgres:password@<source_db_ip>:5432/postgres"    -e TARGET_DB_URL="postgres://postgres:password@<target_db_ip>:5432/postgres"   -it --rm --network=pg_regress_localnet shayonj/pg_easy_replicate:latest pg_easy_replicate bootstrap --group-name database-cluster-1 --copy-schema
```

### Start sync

Once the bootstrap is complete, you can start the sync. Starting the sync sets up the publication, subscription and performs other minor housekeeping things.

```shell
$ docker run -e SOURCE_DB_URL="postgres://postgres:password@192.168.64.2:5432/postgres"    -e TARGET_DB_URL="postgres://postgres:password@192.168.64.3:5432/postgres"   -it --rm --network=pg_regress_localnet shayonj/pg_easy_replicate:latest pg_easy_replicate start_sync --group-name database-cluster-1 
```

## Test logical replication

### Query

Now we can query the target database to get the nearest neighbor of a vector in the `embedding` column of the `test` table. The result is the same as the source database. 

```sql
postgres=# SELECT id FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
 id 
----
 82
 69
 80
 22
 31
 20
 85
 97
 72
(10 rows)
```

#### Update index

If you insert data into the source database, the data will be synchronized to the target database. Insert data into the source database:

```sql
INSERT INTO test
SELECT i, ARRAY[random(), random(),random(),random(),random(),random(),random(),random(),random()]::real[] 
FROM generate_series(101, 200) i;
```

Query in the source database:

```sql
postgres=# SELECT id FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
id  
-----
  82
 130
 145
  69
  80
 200
  22
  31
 182
 (10 rows)
```

Query in the target database, it will return the same result:

```sql
postgres=# SELECT id FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
id  
-----
  82
 130
 145
  69
  80
 200
  22
  31
 182
 (10 rows)
```
