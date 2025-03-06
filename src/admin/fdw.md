# Foreign data wrapper (FDW)

[Foreign data wrapper(FDW)](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) is an extension in PostgreSQL that allows you to access and query data stored in remote databases as if they were local tables. FDW provides a way to integrate and interact with different data sources.

With the FDW extension, you can define foreign tables in your local PostgreSQL database that mirror the structure of tables in remote databases. These foreign tables act as proxies or wrappers for the remote data, enabling you to perform SELECT, INSERT, UPDATE, and DELETE operations on them, just like regular tables in PostgreSQL.

In this tutorial, we will use the [`postgres_fdw`](https://www.postgresql.org/docs/current/postgres-fdw.html) module, which includes the foreign-data wrapper. This wrapper can be used to access data stored in external PostgreSQL servers. This article will explain how to use `postgres_fdw` to access index data in a foreign PostgreSQL cluster that already has the [`pgvecto.rs`](https://github.com/tensorchord/pgvecto.rs) extension installed.

## Deploy local and foreign PostgreSQL clusters

In this tutorial, we will use docker compose to deploy two PostgreSQL clusters.

``` shell
$ echo 'version: "3.7"
services:
  local_db:
    image: tensorchord/pgvecto-rs:pg15-v0.2.0
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password
    command: >
      -c shared_preload_libraries=vectors.so
    networks:
      localnet:

  forigen_db:
    image: tensorchord/pgvecto-rs:pg15-v0.2.0
    ports:
      - "5433:5432"
    environment:
      POSTGRES_PASSWORD: password
    command: >
      -c shared_preload_libraries=vectors.so
    networks:
      localnet:

networks:
  localnet:
' > docker-compose.yml

$ docker compose up -d
```

```shell
# create extension postgres_fdw in local db
$ psql -h <local_db_ip> -U postgres -p 5432 
DROP EXTENSION IF EXISTS postgres_fdw;
CREATE EXTENSION postgres_fdw;

# create extension vectors in foreign db
$ psql -h <foreign_db_ip> -U postgres -p 5432
DROP EXTENSION IF EXISTS "vectors";
CREATE EXTENSION "vectors";
```

## Foreign database operations

First, we need create a table `test` and build an index on it in the foreign db. The `test` table has two columns: `id` and `embedding`. The `embedding` column is a vector column, and its type is `vector(10)`. The `id` column is the primary key of the `test` table.

### Create a table
```sql
DROP TABLE IF EXISTS test;
CREATE TABLE test (id integer PRIMARY KEY, embedding vector(10) NOT NULL);
INSERT INTO test SELECT i, ARRAY[random(),random(),random(),random(),random(),random(),random(),random(),random(),random()]::real[] FROM generate_series(1, 100) i;
```

### Create a user

Create a user named `fdw_user` in foreign db, and grant `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges on table `test` to `fdw_user`.

```sql
CREATE USER fdw_user WITH ENCRYPTED PASSWORD 'secret';
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE test TO fdw_user;
```

### Create the index

We create an index on the `embedding` column of the `test` table. The index type is flat, it is a brute force algorithm. We choose `vector_l2_ops` squared Euclidean distance to measure the distance between vectors. Another index type and distance function can be found in [here](https://docs.vectorchord.ai/usage/indexing.html).

```sql
CREATE INDEX ON test USING vectors (embedding vector_l2_ops) WITH (options = "[indexing.flat]");
```

## Local database operations

In local database, we need to create a table `local` and a foreign server `foreign_server`. The `local` table has two columns: `id` and `name`. The `id` column is the primary key of the `local` table. The `foreign_server` is a foreign server, which is used to access the foreign db.

### Create local table

```sql
DROP TABLE IF EXISTS local;
CREATE TABLE local (id integer PRIMARY KEY, name VARCHAR(50) NOT NULL);
INSERT INTO local (id, name) VALUES (1, 'terry'), (2, 'jason'), (3, 'curry');
```

### create local user

Using superuser, execute the following statement in the local PostgreSQL database to create a regular user named `local_user`.

```sql
CREATE USER local_user WITH ENCRYPTED PASSWORD 'secret';
```

### Create the foreign server

To create an external server using the `CREATE SERVER` statement, you need to specify the host, port, and database name of the remote database.

```sql
CREATE SERVER foreign_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host '<foreign_db_ip>', port '5432', dbname 'postgres');
```

### Create the user mapping

Use the `CREATE USER MAPPING` statement to create a mapping between remote users and local users, requiring the username and password of the remote user.

```sql
CREATE USER MAPPING FOR local_user
    SERVER foreign_server
    OPTIONS (user 'fdw_user', password 'secret');
```
### Creat the foreign table

Use the `CREATE FOREIGN TABLE` statement to create a remote table. It is important to note that the types of each column should match those of the actual remote table, and it's best to keep the column names consistent. Otherwise, you will need to use the column_name parameter to specify the column name in the remote table for each individual column.

```sql
CREATE FOREIGN TABLE foreign_test (id integer, embedding vector(10) NOT NULL)
    SERVER foreign_server
    OPTIONS (schema_name 'public', table_name 'test');
```

### Authorization

Authorize the `local_user`:
- Grant `local_user` the permission to use postgres_fdw. 
- Grant `local_user` the permission to use foreign server `foreign_server`.
- Grant `local_user` the permission to access all tables in schema `public`.

```sql
GRANT USAGE ON FOREIGN DATA WRAPPER postgres_fdw TO local_user;
GRANT USAGE ON FOREIGN SERVER foreign_server TO local_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO local_user;
```

## Query

Now we can use join query to access the foreign table in local db.
```shell
$ psql -h <local_db_ip> -U local_user -p 5432 -d postgres
```

```sql
SELECT l.id, l.name FROM local l LEFT JOIN foreign_test f on l.id = f.id ORDER BY f.embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
 id | name  
----+-------
  2 | jason
  3 | curry
  1 | terry


EXPLAIN SELECT l.id, l.name FROM local l LEFT JOIN foreign_test f on l.id = f.id ORDER BY f.embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]' LIMIT 10;
 Limit  (cost=209.63..209.65 rows=10 width=126)
   ->  Sort  (cost=209.63..213.04 rows=1365 width=126)
         Sort Key: ((f.embedding <-> '[0.40671515, 0.24202824, 0.37059402, 0.50316447, 0.10779921, 0.80774295, 0.8879849, 0.31292745, 0.05584943, 0.8738258]'::vector))
         ->  Hash Right Join  (cost=122.15..180.13 rows=1365 width=126)
               Hash Cond: (f.id = l.id)
               ->  Foreign Scan on foreign_test f  (cost=100.00..150.95 rows=1365 width=36)
               ->  Hash  (cost=15.40..15.40 rows=540 width=122)
                     ->  Seq Scan on local l  (cost=0.00..15.40 rows=540 width=122)
```
