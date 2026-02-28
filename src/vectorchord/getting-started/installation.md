# Installation

VectorChord is tested on the following operating system:

* Ubuntu (x86_64, aarch64)
* MacOS (x86_64, aarch64)
* Windows (x86_64)
* Alpine Linux (x86_64, aarch64) [^1]
* Debian (powerpc64le, s390x, riscv64) [^2]

[^1]: VectorChord is tested with PostgreSQL 15 in `community` repository, 16 and 17 in `main` repository on Alpine Linux 3.22.
[^2]: VectorChord is tested with PostgreSQL 13, 14, 15, 16, 17 and 18 in PostgreSQL's official repository on `powerpc64le`, and PostgreSQL 15 and 17 in Debian's official repository on `s390x` and `riscv64`, with QEMU user space emulator.

Please report a bug if you encounter issues on any of the above operating systems, or submit a feature request for additional platform support.

## Docker

### VectorChord Image

<a href="https://hub.docker.com/r/tensorchord/vchord-postgres"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord-postgres" /></a>

The easiest way to try VectorChord is to run it from a ready-to use [Docker image](https://hub.docker.com/r/tensorchord/vchord-postgres).

1. Launch a VectorChord container in Docker.

```sh
docker run \
  --name vchord-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/vchord-postgres:pg18-v1.1.1
```

2. Connect to the database using the `psql` command line tool. The default username is `postgres`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
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

### VectorChord Scratch Image

<a href="https://hub.docker.com/r/tensorchord/vchord-scratch"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord-scratch" /></a>

We provide a scratch image that contains only the files of VectorChord. You can install VectorChord in any image using Docker's `COPY`, like

```dockerfile
FROM tensorchord/vchord-scratch:pg18-v1.1.1 AS vchord_scratch
FROM postgres:18-bookworm
RUN apt-get update && apt-get install -y postgresql-18-pgvector
COPY --from=vchord_scratch / /
CMD ["postgres", "-c" ,"shared_preload_libraries=vchord,vector"]
```

This image can also be used as a CloudNativePG image volume extension. See also

* [Image Volume Extensions](https://cloudnative-pg.io/docs/1.28/imagevolume_extensions/)
* [Kubernetes](../admin/kubernetes)

## Source

::: tip

Build requirements:

* any port of `make`
* `clang >= 16` with `libclang`
* `rust >= 1.93` with `cargo`

It's recommended to use Rustup for installing Rust on most platforms, while on Alpine Linux, using the system package manager is advised.

You can set the environment variable `CC` to specify the desired C compiler for the build system. If you do not set this variable, the build system automatically searches for clang and gcc. To compile all C code with clang, set `CC` to the path of clang. To compile all C code with gcc, set `CC` to the path of gcc; note that in this case, there is a requirement `gcc >= 14`.

Rust version requirement is not a long-term guarantee; we will raise the required Rust version with each new release.

These build requirements apply only to x86_64 and aarch64. For all other architectures, including powerpc64le, s390x and riscv64, nightly Rust and latest Clang are required.

:::

If you have not installed PostgreSQL yet, please install PostgreSQL. If you have not installed pgvector yet, you could install pgvector before the 3rd step.

1. Download the source code, build and install it with `make`.

```sh
curl -fsSL https://github.com/tensorchord/VectorChord/archive/refs/tags/1.1.1.tar.gz | tar -xz
cd VectorChord-1.1.1
make build
make install # or `sudo make install`
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord"'
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

### Tuning

VectorChord performs runtime CPU dispatch for SIMD code. If you want the compiler to optimize the whole program for a particular CPU, you could instruct it to generate code for that CPU.

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
cd VectorChord-1.1.1
mkdir -p .cargo
touch .cargo/config.toml
echo 'build.rustflags = ["-Ctarget-cpu=icelake"]' >> ./cargo/config.toml
```

## Debian

If you have not installed PostgreSQL yet, please install PostgreSQL following https://www.postgresql.org/download/linux/debian/. If you have not installed pgvector yet, you could install pgvector by `apt install postgresql-18-pgvector` before the 3rd step.

1. Download Debian packages in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and install them by `apt`.

```sh
wget https://github.com/tensorchord/VectorChord/releases/download/1.1.1/postgresql-18-vchord_1.1.1-1_$(dpkg --print-architecture).deb
sudo apt install ./postgresql-18-vchord_1.1.1-1_$(dpkg --print-architecture).deb
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

## Ubuntu

If you have not installed PostgreSQL yet, please install PostgreSQL following https://www.postgresql.org/download/linux/ubuntu/. If you have not installed pgvector yet, you could install pgvector by `apt install postgresql-18-pgvector` before the 3rd step.

1. Download Debian packages in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and install them by `apt`.

```sh
wget https://github.com/tensorchord/VectorChord/releases/download/1.1.1/postgresql-18-vchord_1.1.1-1_$(dpkg --print-architecture).deb
sudo apt install ./postgresql-18-vchord_1.1.1-1_$(dpkg --print-architecture).deb
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

## PGXN

::: tip

See [Source](#source) for build requirements.

:::

If you have not installed PostgreSQL yet, please install PostgreSQL. If you have not installed pgvector yet, you could install pgvector by `pgrxclient install vector` before the 3rd step.

1. Install VectorChord from [PostgreSQL Extension Network](https://pgxn.org/dist/vchord) with:

```sh
pgxnclient install vchord # or `pgxnclient install vchord --sudo`
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord"'
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

::: tip

There is a broken VectorChord `0.4.1` package on PGXN. Please do not use it. Use version `0.4.2` or later instead.

:::

## Prebuilt binaries <badge type="danger" text="deprecated" />

::: warning

Prebuilt binaries may not match the PostgreSQL in ABI on your machine, which could cause silent errors. We strongly recommend that you build from source in this case.

:::

If you have not installed PostgreSQL yet, please install PostgreSQL. If you have not installed pgvector yet, you could install pgvector before the 3rd step.

1. Download prebuilt binaries in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and repackage it referring to your distribution's documentation. Then install it by system package manager. We do not recommend doing this, but if you wish, you can also manually copy the files to the system directory.

```sh
cp -r ./pkglibdir/. $(pg_config --pkglibdir)
cp -r ./sharedir/. $(pg_config --sharedir)
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension. And then restart the PostgreSQL cluster.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord"'
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```
