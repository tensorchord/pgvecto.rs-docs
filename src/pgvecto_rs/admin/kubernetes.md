# Kubernetes

If you want to use `pgvecto.rs` in PostgreSQL which is running in Kubernetes, we provide a tutorial to help you. In this tutorial, we will use [CloudNative-PG](https://cloudnative-pg.io/) to deploy PostgreSQL cluster in Kubernetes.

## Requirements

| Name | Version |
|------|---------|
| [helm](https://helm.sh/) | >= 2.4.1 |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | >= 1.14 |
| [Kubernetes](https://kubernetes.io/) | >= 1.24.0 |

## Install CloudNative-PG

We use [CloudNative-PG (cnpg)](https://cloudnative-pg.io/) to deploy PostgreSQL cluster in Kubernetes. You can install it by [helm](https://helm.sh/docs/intro/install/).

```shell
$ sudo helm repo add cnpg https://cloudnative-pg.github.io/charts
$ sudo helm upgrade --install cnpg   --namespace cnpg-system   --create-namespace   cnpg/cloudnative-pg
$ helm list --all-namespaces
NAME                    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                         APP VERSION
cnpg                    cnpg-system     1               2024-01-02 08:17:11.661297545 +0000 UTC deployed        cloudnative-pg-0.20.0         1.22.0     
$ kubectl get pod -n cnpg-system   
NAME                                   READY   STATUS    RESTARTS   AGE
cnpg-cloudnative-pg-67ff4f5f66-94m8d   1/1     Running   0          1m
```

## Build PostgreSQL image with `pgvecto.rs`

We use the official [CloudNative-PG docker image](https://github.com/cloudnative-pg/postgres-containers) as the base image, and install `pgvecto.rs` in it. And you can also find `pgvecto.rs` version from [releases](https://github.com/tensorchord/pgvecto.rs/releases).

```dockerfile
# syntax=docker/dockerfile-upstream:master
ARG CNPG_TAG

FROM ghcr.io/cloudnative-pg/postgresql:$CNPG_TAG

ARG CNPG_TAG
ARG PGVECTORS_TAG
ARG TARGETARCH

# drop to root to install packages
USER root

# install pgvecto.rs
ADD https://github.com/tensorchord/pgvecto.rs/releases/download/$PGVECTORS_TAG/vectors-pg${CNPG_TAG%.*}_${PGVECTORS_TAG#"v"}_$TARGETARCH.deb ./pgvectors.deb
RUN apt install ./pgvectors.deb

USER postgres
```

```shell
$ docker build -t <your-postgresql-image-repo>:15 --build-arg CNPG_TAG=15 --build-arg PGVECTORS_TAG=v0.1.13   --build-arg TARGETARCH=amd64 .
```
> Notice: PostgreSQL docker image tag must start with CNPG_TAG for cloudnative-pg to recognize the postgres version.

## Create PostgreSQL cluster

We provide a sample yaml file to create a PostgreSQL cluster in Kubernetes. You can modify it according to your needs. You need pay attention to the following points:
- Set `shared_preload_libraries` to load `pgvecto.rs` shared library. You can also set `postInitApplicationSQL`  `ALTER SYSTEM SET shared_preload_libraries = "vectors.so";` to load `pgvecto.rs` shared library. 
- Execute `CREATE EXTENSION IF NOT EXISTS "vectors";` to create `vectors` extension.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tensorchord
type: kubernetes.io/basic-auth
data:
  password: dGVuc29yY2hvcmQ= # tensorchord 
  username: dGVuc29yY2hvcmQ= # tensorchord
---
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: pgvectors 
spec:
  instances: 1 
  bootstrap:
    initdb:
      database: tensorchord
      postInitApplicationSQL:
        - CREATE EXTENSION IF NOT EXISTS "vectors";
      owner: tensorchord
      secret:
        name: tensorchord
      dataChecksums: true
      encoding: 'UTF8'
  storage:
    size: 1Gi
  imageName: <your-postgresql-image-repo>:<pg-tag>
  postgresql:
    shared_preload_libraries: # load pgvecto.rs shared library
    - "vectors.so"
```

You can install `cnpg` [kubectl plugin](https://cloudnative-pg.io/docs/1.28/kubectl-plugin) to manage your PostgreSQL cluster. Now we can check the status of the cluster.

```shell
$ sudo kubectl get pod
pgvectors-1                                                1/1     Running   0             3m54s

$ kubectl cnpg status pgvectors
Cluster Summary
Name:                pgvectors
Namespace:           default
System ID:           7323107530735296538
PostgreSQL Image:    docker.io/xieydd/pgvectors:15
Primary instance:    pgvectors-1
Primary start time:  2024-01-12 07:17:34 +0000 UTC (uptime 17m33s)
Status:              Cluster in healthy state 
Instances:           1
Ready instances:     1
Current Write LSN:   0/4000000 (Timeline: 1 - WAL File: 000000010000000000000003)

Certificates Status
Certificate Name       Expiration Date                Days Left Until Expiration
----------------       ---------------                --------------------------
pgvectors-ca           2024-04-11 07:12:00 +0000 UTC  89.98
pgvectors-replication  2024-04-11 07:12:00 +0000 UTC  89.98
pgvectors-server       2024-04-11 07:12:00 +0000 UTC  89.98

Continuous Backup status
Not configured

Physical backups
No running physical backups found

Streaming Replication status
Not configured

Unmanaged Replication Slot Status
No unmanaged replication slots found

Managed roles status
No roles managed

Tablespaces status
No managed tablespaces

Instances status
Name         Database Size  Current LSN  Replication role  Status  QoS         Manager Version  Node
----         -------------  -----------  ----------------  ------  ---         ---------------  ----
pgvectors-1  29 MB          0/4000000    Primary           OK      BestEffort  1.22.0           kind-control-plane
```

> Notice: This article just provides a minimal configuration, not include logical replication, streaming logical replication, backup and restore, etc. We will provide those in another article. You can also refer to [CloudNative-PG](https://cloudnative-pg.io/docs/) for more `Cluster` configuration.

## Connect to PostgreSQL cluster

You can use `kubectl port-forward` to connect to PostgreSQL cluster.

```shell
$ kubectl port-forward services/pgvectors-rw 5432:5432
$ psql -h 127.0.0.1 -d tensorchord -U tensorchord
tensorchord=> \dx
Name   | Version |   Schema   |                                         Description                                          
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vectors | 0.1.13  | public     | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
```

The `vectors` extension is installed successfully. You can try [quick-start](https://docs.vectorchord.ai/getting-started/overview.html) without installation.
