# General FAQ

## The vector type or operator class is not found

In most cases, this is due to a missing schema search path or a lack of permissions. 

Please go through this checklist:

1. Run `\dx` with `psql` or `SELECT * FROM pg_extension;` and check if the extension exists.

```bash
postgres=# \dx
                                                    List of installed extensions
  Name   |    Version    |   Schema   |                                         Description                                          
---------+---------------+------------+----------------------------------------------------------------------------------------------
 vectors | 0.3.0         | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
```

If not, install it with `CREATE EXTENSION vectors;`

2. Run `SHOW search_path;` and check if it contains `vectors`.

```bash
postgres=# SHOW search_path;
       search_path        
--------------------------
 "$user", public, vectors
```
If not, set it with `SET search_path="$user", public, vectors;`

3. If `pgvecto.rs` is installed by another superuser

Run `\dn` with `psql` or `SELECT nspname FROM pg_catalog.pg_namespace;` and check if the schema `vectors` exists.

```bash
postgres=# SELECT current_user;
 current_user 
--------------
 tensorchord

postgres=# \dn
       List of schemas
  Name   |       Owner       
---------+-------------------
 public  | pg_database_owner
 vectors | postgres
```

If not, log in as the superuser and grant schema permissions to `current_user`:

`GRANT ALL ON SCHEMA vectors to tensorchord;`