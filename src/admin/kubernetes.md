# How to use pgvecto.rs in Kubernetes?

If you want to use `pgvecto.rs` in PostgreSQL which is running in Kubernetes, we provide a tutorial to help you. In this tutorial, we will use [CloudNative-PG](https://cloudnative-pg.io/) to deploy PostgreSQL cluster in Kubernetes.

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_helm"></a> [helm](#requirement\_helm) | >= 2.4.1 |
| <a name="requirement_kubectl"></a> [kubectl](#requirement\_kubectl) | >= 1.14 |
| <a name="requirement_kubernetes"></a> [kubernetes](#requirement\_kubernetes) | >= 2.10 |

## Helm Instal CloudNative-PG

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

## Build PostgreSQL Docker Image

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
> Notice: PostgreSQL docker image tag must contain CNPG_TAG.

## Create PostgreSQL Cluster In Kubernetes

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
  instances: 3 
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

We can check the status of the cluster after the cluster is created.

```shell
$ sudo kubectl get pod
pgvectors-1                                                1/1     Running   0             3m54s
pgvectors-2                                                1/1     Running   0             3m31s
pgvectors-3                                                1/1     Running   0             3m8s

$ $ sudo kubectl cnpg status pgvectors
Cluster Summary
Name:               pgvectors
Namespace:          default
System ID:          7320256283141423133
PostgreSQL Image:   postgresql-pgvectors:15
Primary instance:   pgvectors-1
Status:             Cluster in healthy state 
Instances:          3
Ready instances:    3
Current Write LSN:  0/6031038 (Timeline: 1 - WAL File: 000000010000000000000006)

Certificates Status
Certificate Name       Expiration Date                Days Left Until Expiration
----------------       ---------------                --------------------------
pgvectors-ca           2024-04-03 14:47:56 +0000 UTC  89.99
pgvectors-replication  2024-04-03 14:47:56 +0000 UTC  89.99
pgvectors-server       2024-04-03 14:47:56 +0000 UTC  89.99

Continuous Backup status
Not configured

Streaming Replication status
Replication Slots Enabled
Name         Sent LSN   Write LSN  Flush LSN  Replay LSN  Write Lag  Flush Lag  Replay Lag  State      Sync State  Sync Priority  Replication Slot
----         --------   ---------  ---------  ----------  ---------  ---------  ----------  -----      ----------  -------------  ----------------
pgvectors-2  0/6031038  0/6031038  0/6031038  0/6031038   00:00:00   00:00:00   00:00:00    streaming  async       0              active
pgvectors-3  0/6031038  0/6031038  0/6031038  0/6031038   00:00:00   00:00:00   00:00:00    streaming  async       0              active

Unmanaged Replication Slot Status
No unmanaged replication slots found

Instances status
Name         Database Size  Current LSN  Replication role  Status  QoS         Manager Version  Node
----         -------------  -----------  ----------------  ------  ---         ---------------  ----
pgvectors-1  29 MB          0/6031038    Primary           OK      BestEffort  1.22.0           kind-control-plane
pgvectors-2  29 MB          0/6031038    Standby (async)   OK      BestEffort  1.22.0           kind-control-plane
pgvectors-3  29 MB          0/6031038    Standby (async)   OK      BestEffort  1.22.0           kind-control-plane
```

You can install `cnpg` [kubectl plugin](https://cloudnative-pg.io/documentation/1.22/kubectl-plugin/) to manage your PostgreSQL cluster.

## Connect To PostgreSQL

We can connect to PostgreSQL cluster and validate `vectors` extension has been installed successfully.

```shell
$ kubectl port-forward services/pgvectors-rw 5432:5432
$ psql -h 127.0.0.1 -d tensorchord -U tensorchord
Password for user tensorchord: 
psql (14.10 (Ubuntu 14.10-0ubuntu0.22.04.1), server 15.5 (Debian 15.5-1.pgdg110+1))
WARNING: psql major version 14, server major version 15.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

tensorchord=> \dx
Name   | Version |   Schema   |                                         Description                                          
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vectors | 0.1.13  | public     | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
```

The `vectors` extension is installed successfully. You can try [quick-start](http://localhost:5173/getting-started/overview.html#quick-start) without installition.