# Setting up logical replication

Logical replication is a method of replicating data objects and their changes, based upon their replication identity (usually a primary key). It is often used in migration, Change Data Capture(CDC), and fine-grained database integration and access control. 

In this article, we will introduce how to set logical replication for pgvecto.rs index. Even if the source index instance goes down, you can still query the target database using the index.

## Deploying PostgreSQL Clusters

In this tutorial, we will use docker compose to deploy two PostgreSQL clusters.

``` shell
$ echo 'version: "3.7"
services:
  source_db:
    image: tensorchord/pgvecto-rs:pg15-v0.1.13 
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
    image: tensorchord/pgvecto-rs:pg15-v0.1.13 
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

## Set Logical Replication

Now, we can set logical replication between source database and target database.

###  Prepare Data 

We need to create a table named `test` with a column named `embedding` of type `vector(10)` in source database and target database. Then we create an index on the `embedding` column of the `test` table in source database and target database. Finally, we insert data into the source database.

#### Create test table

```sql
DROP TABLE IF EXISTS test;
CREATE TABLE test (id integer PRIMARY KEY, embedding vector(10) NOT NULL);
```

#### Create index

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

###  Config Logical Replication

To simplify the process of setting up logical replication between two PostgreSQL databases, we will use [pg-easy-replicate](https://github.com/shayonj/pg_easy_replicate).

#### Config Check

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

### Start Sync

Once the bootstrap is complete, you can start the sync. Starting the sync sets up the publication, subscription and performs other minor housekeeping things.

```shell
$ docker run -e SOURCE_DB_URL="postgres://postgres:password@192.168.64.2:5432/postgres"    -e TARGET_DB_URL="postgres://postgres:password@192.168.64.3:5432/postgres"   -it --rm --network=pg_regress_localnet shayonj/pg_easy_replicate:latest pg_easy_replicate start_sync --group-name database-cluster-1 
```

## Test Logical Replication

### Query In Target Database

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

#### Update Index

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
