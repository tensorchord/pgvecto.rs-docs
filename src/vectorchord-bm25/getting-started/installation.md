# Installation

VectorChord-bm25 is tested on the following operating system:

* Ubuntu (x86_64, aarch64)

Please report a bug if you encounter issues on any of the above operating systems, or submit a feature request for additional platform support.

## Docker

### VectorChord-bm25 Image

<a href="https://hub.docker.com/r/tensorchord/vchord_bm25-postgres"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord_bm25-postgres" /></a>

The easiest way to try VectorChord-bm25 is to run it from a ready-to use [Docker image](https://hub.docker.com/r/tensorchord/vchord_bm25-postgres).

1. Launch a VectorChord-bm25 container in Docker.

```sh
docker run \
  --name vchord_bm25-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/vchord_bm25-postgres:pg18-v0.4.0
```

2. Connect to the database using the `psql` command line tool. The default username is `postgres`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
```

::: tip

To achieve full performance, please mount the volume to PostgreSQL data directory by adding the option like:

* `-v $PWD/pgdata:/var/lib/postgresql/18/docker`, on PostgreSQL 18
* `-v $PWD/pgdata:/var/lib/postgresql/data`, on PostgreSQL 14, 15, 16 and 17

You can configure PostgreSQL by the reference of the parent image in https://hub.docker.com/_/postgres/.

:::

### VectorChord Suite Image

<a href="https://hub.docker.com/r/tensorchord/vchord-suite"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord-suite"/></a>

In addition to the base image with the VectorChord extension, we provide an all-in-one image, `tensorchord/vchord-suite:pg18-latest`. This comprehensive image includes all official TensorChord extensions. Developers should select an image tag that is compatible with their extension's version, as indicated in [the support matrix](https://github.com/tensorchord/VectorChord-images?tab=readme-ov-file#support-matrix).

1. Launch a VectorChord container in Docker.

```sh
docker run \
  --name vchord-suite \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d tensorchord/vchord-suite:pg18-latest
  # If you want to use ghcr image, you can change the image to `ghcr.io/tensorchord/vchord-suite:pg18-latest`.
  # if you want to use the specific version, you can use the tag `pg17-20250815`, supported version can be found in the support matrix.
```

Other sections may align with the above.

See also [VectorChord Suite](/vectorchord/getting-started/vectorchord-suite).

### VectorChord-bm25 Scratch Image

<a href="https://hub.docker.com/r/tensorchord/vchord_bm25-scratch"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord_bm25-scratch" /></a>

We provide a scratch image that contains only the files of VectorChord-bm25. You can install VectorChord-bm25 in any image using Docker's `COPY`, like

```dockerfile
FROM tensorchord/vchord_bm25-scratch:pg18-v1.1.1 AS vchord_bm25_scratch
FROM postgres:18-bookworm
COPY --from=vchord_bm25_scratch / /
CMD ["postgres", "-c" ,"shared_preload_libraries=vchord_bm25"]
```

This image can also be used as a CloudNativePG image volume extension. See also

* [Image Volume Extensions](https://cloudnative-pg.io/docs/1.28/imagevolume_extensions/)

## Source

::: tip

Build requirements:

* any port of `make`
* any C compiler
* `rust >= 1.94` with `cargo`

It's recommended to use Rustup for installing Rust on most platforms, while on Alpine Linux, using the system package manager is advised.

You can set the environment variable `CC` to specify the desired C compiler for the build system. If you do not set this variable, the build system automatically searches for clang and gcc.

Rust version requirement is not a long-term guarantee; we will raise the required Rust version with each new release.

These build requirements apply only to x86_64 and aarch64. For all other architectures, including powerpc64le, s390x and riscv64, nightly Rust is required.

:::

If you have not installed PostgreSQL yet, please install PostgreSQL.

1. Download the source code, build and install it with `make`.

```sh
curl -fsSL https://github.com/tensorchord/VectorChord-bm25/archive/refs/tags/0.4.0.tar.gz | tar -xz
cd VectorChord-bm25-0.4.0
make build
make install # or `sudo make install`
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord_bm25"'
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
```

### Tuning

VectorChord-bm25 performs runtime CPU dispatch for SIMD code. If you want the compiler to optimize the whole program for a particular CPU, you could instruct it to generate code for that CPU.

```sh
RUSTFLAGS="-Ctarget-cpu=icelake" make build
```

To see all valid CPU options and the default CPU for your target triple, run:

```sh
rustc --print target-cpus
```

To generate code for the host machine, run:

```sh
RUSTFLAGS="-Ctarget-cpu=native" make build
```

Please note that binaries generated with a specific `target-cpu` are not compatible with other CPUs.

You can also do it by using Cargo's configuration.

```sh
cd VectorChord-bm25-0.4.0
mkdir -p .cargo
touch .cargo/config.toml
echo 'build.rustflags = ["-Ctarget-cpu=icelake"]' >> ./cargo/config.toml
```

## Debian

If you have not installed PostgreSQL yet, please install PostgreSQL following https://www.postgresql.org/download/linux/debian/.

1. Download Debian packages in [the release page](https://github.com/tensorchord/VectorChord-bm25/releases/latest), and install them by `apt`.

```sh
wget https://github.com/tensorchord/VectorChord-bm25/releases/download/0.4.0/postgresql-18-vchord-bm25_0.4.0-1_$(dpkg --print-architecture).deb
sudo apt install ./postgresql-18-vchord-bm25_0.4.0-1_$(dpkg --print-architecture).deb
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord_bm25"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
```

## Ubuntu

If you have not installed PostgreSQL yet, please install PostgreSQL following https://www.postgresql.org/download/linux/ubuntu/.

1. Download Debian packages in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and install them by `apt`.

```sh
wget https://github.com/tensorchord/VectorChord-bm25/releases/download/0.4.0/postgresql-18-vchord-bm25_0.4.0-1_$(dpkg --print-architecture).deb
sudo apt install ./postgresql-18-vchord-bm25_0.4.0-1_$(dpkg --print-architecture).deb
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord_bm25"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
```

## PGXN

::: tip

See [Source](#source) for build requirements.

:::

If you have not installed PostgreSQL yet, please install PostgreSQL.

1. Install VectorChord-bm25 from [PostgreSQL Extension Network](https://pgxn.org/dist/vchord_bm25) with:

```sh
pgxnclient install vchord_bm25 # or `pgxnclient install vchord_bm25 --sudo`
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord_bm25"'
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord_bm25;
```
