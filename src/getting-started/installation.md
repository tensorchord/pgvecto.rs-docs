# Installation

There are three ways to install pgvecto.rs.

## Docker

<a href="https://hub.docker.com/r/tensorchord/pgvecto-rs"><img src="https://img.shields.io/docker/pulls/tensorchord/pgvecto-rs" /></a>


The easiest way to try pgvecto.rs is to run it from a ready-to use [Docker image](https://hub.docker.com/r/tensorchord/pgvecto-rs).

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.1.13
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

Run the following SQL to ensure the extension is enabled.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

To achieve full performance, please mount the volume to pg data directory by adding the option like `-v $PWD/pgdata:/var/lib/postgresql/data`

You can configure PostgreSQL by the reference of the parent image in https://hub.docker.com/_/postgres/.

## From release

1. Download the deb package in the release page, and type `sudo apt install vectors-pg15-*.deb` to install the deb package.

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include `vectors.so`.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vectors.so"'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
```

3. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

## From source

Before building from source, you could refer to the [development guide](/developers/development.md) to set up the development environment.

Then you could build and install the extension.

```sh
cargo pgrx install --sudo --release
```

Configure your PostgreSQL by modifying the `shared_preload_libraries` to include `vectors.so`.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vectors.so"'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
service postgresql restart  # for pgvecto.rs running in envd
```

Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```
