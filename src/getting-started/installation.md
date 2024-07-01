# Installation

There are four ways to install `pgvecto.rs`.

## Docker

<a href="https://hub.docker.com/r/tensorchord/pgvecto-rs"><img src="https://img.shields.io/docker/pulls/tensorchord/pgvecto-rs" /></a>


The easiest way to try `pgvecto.rs` is to run it from a ready-to use [Docker image](https://hub.docker.com/r/tensorchord/pgvecto-rs).

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.2.0
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

## From Debian package

::: tip
Installation from the Debian package requires a dependency on `GLIBC >= 2.31`, e.g:
- `Ubuntu 20.04` or later
- `Debian Bullseye` or later
:::

Debian packages(.deb) are used in distributions based on Debian, such as Ubuntu and many others. They can be easily installed by `dpkg` or `apt-get`.

1. Download the deb package in [the release page](https://github.com/tensorchord/pgvecto.rs/releases/latest), and type `sudo apt install vectors-pg15-*.deb` to install the deb package.

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` and `search_path` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vectors.so"'
psql -U postgres -c 'ALTER SYSTEM SET search_path TO "$user", public, vectors'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
```

3. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

## From ZIP package <Badge type="tip" text="since v0.2.1" />

::: tip
Installation from the ZIP package requires a dependency on `GLIBC >= 2.31`, e.g:
- `RHEL 9` or later
:::

For systems that are not Debian based and cannot run a Docker container, please follow these steps to install:

1. Before install, make sure that you have the necessary packages installed, including `PostgreSQL`, `pg_config`, `unzip`, `wget`.

```sh
# Example for RHEL 9 dnf
# Please check your package manager
sudo dnf install -y unzip wget libpq-devel
sudo dnf module install -y postgresql:15/server
sudo postgresql-setup --initdb
sudo systemctl start postgresql.service
sudo systemctl enable postgresql.service
```

2. Verify whether `$pkglibdir` and `$shardir` have been set by PostgreSQL. 

```sh
pg_config --pkglibdir
# Print something similar to:
# /usr/lib/postgresql/15/lib or
# /usr/lib64/pgsql

pg_config --sharedir
# Print something similar to:
# /usr/share/postgresql/15 or
# /usr/share/pgsql
```

3. Download the zip package in [the release page](https://github.com/tensorchord/pgvecto.rs/releases/latest) and extract it to a temporary directory.

```sh
wget https://github.com/tensorchord/pgvecto.rs/releases/download/v0.2.1/vectors-pg15_x86_64-unknown-linux-gnu_0.2.1.zip -O vectors.zip
unzip vectors.zip -d vectors
```

4. Copy the extension files to the PostgreSQL directory.

```sh
# Copy library to `$pkglibdir`
sudo cp vectors/vectors.so $(pg_config --pkglibdir)/
# Copy schema to `$shardir`
sudo cp vectors/vectors--* $(pg_config --sharedir)/extension/
sudo cp vectors/vectors.control $(pg_config --sharedir)/extension/
```

5. Configure your PostgreSQL by modifying the `shared_preload_libraries` and `search_path` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vectors.so"'
psql -U postgres -c 'ALTER SYSTEM SET search_path TO "$user", public, vectors'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
```

6. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

## From source

Before building from source, you could refer to the [development guide](/developers/development.md) to set up the development environment.

1. Then you could build and install the extension.

```sh
sed -e "s/@CARGO_VERSION@/0.0.0/g" ./vectors.control  # 0.0.0 here is the version number that you need
sudo cp -a ./sql/upgrade/. $(pg_config --sharedir)/extension
cargo pgrx install --sudo --release
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` and `search_path` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vectors.so"'
psql -U postgres -c 'ALTER SYSTEM SET search_path TO "$user", public, vectors'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for pgvecto.rs running with systemd
service postgresql restart  # for pgvecto.rs running in envd
```

3. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```
