# Installation

There are four ways to install VectorChord.

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
  -d tensorchord/vchord-postgres:pg17-v0.2.2
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

To achieve full performance, please mount the volume to PostgreSQL data directory by adding the option like `-v $PWD/pgdata:/var/lib/postgresql/data`

You can configure PostgreSQL by the reference of the parent image in https://hub.docker.com/_/postgres/.

:::

### VectorChord Suite Image

<a href="https://hub.docker.com/r/tensorchord/vchord-suite"><img src="https://img.shields.io/docker/pulls/tensorchord/vchord-suite"/></a>

In addition to the base image with the VectorChord extension, we provide an all-in-one image, `tensorchord/vchord-suite:pg17-latest`. This comprehensive image includes all official TensorChord extensions. Developers should select an image tag that is compatible with their extension's version, as indicated in [the support matrix](https://github.com/tensorchord/VectorChord-images?tab=readme-ov-file#support-matrix).

1. Launch container

```sh
docker run \
  --name vchord-suite \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d tensorchord/vchord-suite:pg17-20250408
  # If you want to use ghcr image, you can change the image to `ghcr.io/tensorchord/vchord-suite:pg17-20250408`.
  # if you want to use the latest version, you can use the tag `pg17-latest`.
```

Other sections may align with the above.

## Debian packages

::: tip

Installation from Debian packages requires a dependency on `GLIBC >= 2.35`, so only the following distributions are supported:

- `Debian 12 (Bookworm)` or later
- `Ubuntu 22.04` or later

:::

Debian packages are used for Debian-based Linux distributions, including Debian and Ubuntu. They can be easily installed by `apt`. You can use this installation method on x86_64 Linux and aarch64 Linux.

1. Download Debian packages in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and install them by `apt`.

```sh
wget https://github.com/tensorchord/VectorChord/releases/download/0.2.2/postgresql-17-vchord_0.2.2-1_$(dpkg --print-architecture).deb
sudo apt install ./postgresql-17-vchord_0.2.2-1_$(dpkg --print-architecture).deb
```

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord.so"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

## Prebuilt binaries

::: tip

Installation from prebuilt binaries requires a dependency on `GLIBC >= 2.35`, so only the following distributions are supported:

- `Debian 12 (Bookworm)` or later
- `Ubuntu 22.04` or later
- `Red Hat Enterprise 10.0` or later
- `Fedora 36` or later
- `openSUSE 15.6` or later

:::

Prebuilt binaries are used for other Linux distributions. You can consider repackaging the precompiled binaries. You can use this installation method on x86_64 Linux and aarch64 Linux.

1. Download prebuilt binaries in [the release page](https://github.com/tensorchord/VectorChord/releases/latest), and repackage it referring to your distribution's documentation. Then install it by system package manager.

2. Configure your PostgreSQL by modifying the `shared_preload_libraries` to include the extension.

```sh
psql -U postgres -c 'ALTER SYSTEM SET shared_preload_libraries = "vchord.so"'
sudo systemctl restart postgresql.service
```

3. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

## Source

::: tip

VectorChord supports UNIX-like operating systems. Please report an issue if you cannot compile.

VectorChord supports little-endian architectures but only provides performance advantages on x86_64 and aarch64.

:::

You may need to install VectorChord from source. Please follow these steps.

1. Clone the repository and checkout the branch.

```sh
git clone https://github.com/tensorchord/VectorChord.git
cd VectorChord
git checkout "0.2.2"
```

2. Install a C compiler and Rust. For GCC, the version must be 14 or higher. For Clang, the version must be 16 or higher. Other C compilers are not supported. For Rust, the version must be the same as that recorded in `rust-toolchain.toml`.

You could download Clang from https://github.com/llvm/llvm-project/releases.

You could setup Rust with Rustup. See https://rustup.rs/.

3. Install the devtool `cargo-pgrx` and set up it.

```sh
cargo install cargo-pgrx@$(sed -n 's/.*pgrx = { version = "\(=.*\)",.*/\1/p' Cargo.toml) --locked
cargo pgrx init --pg17=$(which pg_config)
```

4. Install the extension to your system.

```sh
sed -i -e "s/@CARGO_VERSION@/0.2.2/g" ./vchord.control
cargo pgrx install --sudo --release
sudo cp -a ./sql/upgrade/. $(pg_config --sharedir)/extension
```

5. Run the following SQL to add the extension to `shared_preload_libraries`. Then restart the PostgreSQL cluster.

```sql
ALTER SYSTEM SET shared_preload_libraries = "vchord.so";
```

6. Run the following SQL to ensure the extension is enabled.

```sql
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
```

::: tip

By default, `VectorChord` only finds `clang` in `PATH` as the C compiler.

If you need to use GCC, please set the environment variable CC to `gcc`.

:::
