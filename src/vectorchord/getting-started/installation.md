# Installation

There are four ways to install VectorChord.

## Docker

<a href="https://hub.docker.com/r/tensorchord/vchord-postgres"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord-postgres" /></a>


The easiest way to try VectorChord is to run it from a ready-to use [Docker image](https://hub.docker.com/r/tensorchord/vchord-postgres).

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/vchord-postgres:pg17-v0.1.0
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

Run the following SQL to ensure the extension is enabled.

```SQL
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

And make sure to add `vchord.so` to the `shared_preload_libraries` in `postgresql.conf`.

```SQL
-- Add vchord and pgvector to shared_preload_libraries --
ALTER SYSTEM SET shared_preload_libraries = 'vchord.so';
```

To create the VectorChord RaBitQ(vchordrq) index, you can use the following SQL.

```SQL
CREATE INDEX ON gist_train USING vchordrq (embedding vector_l2_ops) WITH (options = $$
residual_quantization = true
[build.internal]
lists = [4096]
spherical_centroids = false
$$);
```

## From Debian package

::: tip
Installation from the Debian package requires a dependency on `GLIBC >= 2.35`, e.g:
- `Ubuntu 22.04` or later
- `Debian Bullseye` or later
:::

Debian packages(.deb) are used in distributions based on Debian, such as Ubuntu and many others. They can be easily installed by `dpkg` or `apt-get`.

1. Download the deb package in [the release page](https://github.com/tensorchord/vectorchord/releases/latest), and type `sudo apt install vchord-pg15-*.deb` to install the deb package.

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` and `search_path` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord.so"'
psql -U postgres -c 'ALTER SYSTEM SET search_path TO "$user", public, vchord'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for vectorchord running with systemd
```

3. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vchord;
CREATE EXTENSION vchord CASCADE;
```

## From ZIP package

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

3. Download the zip package in [the release page](https://github.com/tensorchord/vectorchord/releases/latest) and extract it to a temporary directory.

```sh
wget https://github.com/tensorchord/VectorChord/releases/download/0.1.0/vchord-pg15_x86_64-unknown-linux-gnu_0.1.0.zip -O vchord.zip
unzip vchord.zip -d vchord
```

4. Copy the extension files to the PostgreSQL directory.

```sh
# Copy library to `$pkglibdir`
sudo cp vchord/vchord.so $(pg_config --pkglibdir)/
# Copy schema to `$shardir`
sudo cp vchord/vchord--* $(pg_config --sharedir)/extension/
sudo cp vchord/vchord.control $(pg_config --sharedir)/extension/
```

5. Configure your PostgreSQL by modifying the `shared_preload_libraries` and `search_path` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord.so"'
psql -U postgres -c 'ALTER SYSTEM SET search_path TO "$user", public, vchord'
# You need restart the PostgreSQL cluster to take effects.
sudo systemctl restart postgresql.service   # for vectorchord running with systemd
```

6. Connect to the database and enable the extension.

```sql
DROP EXTENSION IF EXISTS vchord;
CREATE EXTENSION vchord CASCADE;
```

## From source

TODO
