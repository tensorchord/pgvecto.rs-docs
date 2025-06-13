# Development

## Set up development environment

You can set up development environment simply using [`envd`](https://github.com/tensorchord/envd). It will create a docker container and install all the dependencies for you.

```sh
pip install envd
git clone https://github.com/tensorchord/pgvecto.rs.git
cd pgvecto.rs
envd up
```

Or you can setup development environment following these steps manually:

1. Install base dependency.

```sh
sudo apt install -y \
    bison \
    build-essential \
    ccache \
    flex \
    gcc \
    git \
    gnupg \
    libreadline-dev \
    libssl-dev \
    libxml2-dev \
    libxml2-utils \
    libxslt-dev \
    lsb-release \
    pkg-config \
    tzdata \
    xsltproc \
    zlib1g-dev
```

2. Install `clang-16`. Other versions of `clang` are not supported.

```sh
sudo sh -c 'echo "deb http://apt.llvm.org/$(lsb_release -cs)/ llvm-toolchain-$(lsb_release -cs)-16 main" >> /etc/apt/sources.list'
wget --quiet -O - https://apt.llvm.org/llvm-snapshot.gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y --no-install-recommends clang-16
```

3. Install Rust. Do not install `rustc` using a package manager.

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

4. Clone the Repository.

```sh
git clone https://github.com/tensorchord/pgvecto.rs.git
cd pgvecto.rs
```

5. Install `cargo-pgrx`.

```sh
cargo install cargo-pgrx --version $(grep -o 'pgrx = { version = "=[^"]*' Cargo.toml | cut -d = -f 4)
cargo pgrx init
```

`cargo-pgrx` is a helpful tool to develop a PostgreSQL extension. You can read the document in https://docs.rs/crate/cargo-pgrx/latest.

### Cross compilation

Assuming that you build binary and schema for `aarch64` target in `x86_64` host environment, you can follow these steps:

1. Install cross compilation toolchain.

```sh
sudo apt install crossbuild-essential-arm64
sudo apt install qemu-user-static
```

Set environment variables.

```sh
LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/aarch64-linux-gnu/lib:/usr/aarch64-linux-gnu/lib64"
```

Set emulator, linker and sysroot for Rust by adding the following section to the end of `~/.cargo/config.toml`.

```toml
[target.aarch64-unknown-linux-gnu]
runner = ["qemu-aarch64-static", "-L", "/usr/aarch64-linux-gnu"]
linker = "aarch64-linux-gnu-gcc"

[env]
BINDGEN_EXTRA_CLANG_ARGS_aarch64_unknown_linux_gnu = "-isystem /usr/aarch64-linux-gnu/include/ -ccc-gcc-name aarch64-linux-gnu-gcc"
```

2. Generate PostgreSQL header files on target architecture. It can be done with `cargo-pgrx` and you can also take advantages of files under `vendor/pgrx_config` and `vendor/pgrx_binding`. For details, please refer to the documentation of `pgrx`.

## Debug

Debug information included in the compiled binary even in release mode so you can always use `gdb` for debugging.

For a debug build, backtrace is printed when a thread in background worker process panics, but not for a session process error. For a release build, backtrace is never printed. But if you set environment variable `RUST_BACKTRACE` to `1`, all backtraces are printed. It's recommended for you to debug a release build with the command `RUST_BACKTRACE=1 cargo pgrx run --release`.
