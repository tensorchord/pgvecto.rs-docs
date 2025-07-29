# Kubernetes

If you want to use `vectorchord` in PostgreSQL which is running in Kubernetes, we provide a tutorial to help you. In this tutorial, we will use [CloudNative-PG](https://cloudnative-pg.io/) to deploy PostgreSQL cluster in Kubernetes.

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
cnpg                    cnpg-system     1               2024-12-30 16:37:55.9520917 +0800 CST   deployed        cloudnative-pg-0.23.0               1.25.0   
$ kubectl get pod -n cnpg-system   
NAME                                   READY   STATUS    RESTARTS   AGE
cnpg-cloudnative-pg-54f97dbcdf-jm97n   1/1     Running   0          1m
```

## PostgreSQL image with `vectorchord`

In the repository, we already provide a docker image with `vectorchord` installed. You can find it in [ghcr.io/tensorchord/cloudnative-vectorchord](https://github.com/tensorchord/cloudnative-vectorchord/pkgs/container/cloudnative-vectorchord). If you want to build your own image, you can use the following Dockerfile as a reference.

```dockerfile
ARG CNPG_TAG

FROM ghcr.io/cloudnative-pg/postgresql:$CNPG_TAG-bookworm

ARG CNPG_TAG
ARG VECTORCHORD_TAG
ARG TARGETARCH

# drop to root to install packages
USER root
ADD https://github.com/tensorchord/VectorChord/releases/download/$VECTORCHORD_TAG/postgresql-${CNPG_TAG%.*}-vchord_${VECTORCHORD_TAG#"v"}-1_$TARGETARCH.deb /tmp/vchord.deb
RUN apt-get install -y /tmp/vchord.deb && rm -f /tmp/vchord.deb

USER postgres
```

## Create PostgreSQL cluster

We provide a sample yaml file to create a PostgreSQL cluster in Kubernetes. You can modify it according to your needs. You need pay attention to the following points:
- Set `shared_preload_libraries` to load `vchord` shared library. 
- Execute `CREATE EXTENSION IF NOT EXISTS vchord CASCADE;` to create `vchord` extension.

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
  name: vchord 
spec:
  instances: 1 
  bootstrap:
    initdb:
      database: tensorchord
      postInitApplicationSQL:
        - CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
      owner: tensorchord
      secret:
        name: tensorchord
      dataChecksums: true
      encoding: 'UTF8'
  storage:
    size: 1Gi
  imageName: ghcr.io/tensorchord/cloudnative-vectorchord:17
  postgresql:
    shared_preload_libraries: # load vchord shared library
    - "vchord.so"
```

You can install `cnpg` [kubectl plugin](https://cloudnative-pg.io/documentation/1.25/kubectl-plugin/) to manage your PostgreSQL cluster. Now we can check the status of the cluster. 

```shell
$ sudo kubectl get pod
vchord-1                                                 1/1     Running     0             42s

$ kubectl cnpg status vchord   
Cluster Summary
Name:                vchord
Namespace:           default
System ID:           7527554386501582867
PostgreSQL Image:    ghcr.io/tensorchord/cloudnative-vectorchord:17
Primary instance:    vchord-1
Primary start time:  2025-07-16 05:55:51 +0000 UTC (uptime 53s)
Status:              Cluster in healthy state 
Instances:           1
Ready instances:     1
Current Write LSN:   0/204FB50 (Timeline: 1 - WAL File: 000000010000000000000002)

Certificates Status
Certificate Name    Expiration Date                Days Left Until Expiration
----------------    ---------------                --------------------------
vchord-ca           2025-10-14 05:50:08 +0000 UTC  90.00
vchord-replication  2025-10-14 05:50:08 +0000 UTC  90.00
vchord-server       2025-10-14 05:50:08 +0000 UTC  90.00

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
Name      Database Size  Current LSN  Replication role  Status  QoS         Manager Version  Node
----      -------------  -----------  ----------------  ------  ---         ---------------  ----
vchord-1                 0/204FB50    Primary           OK      BestEffort  1.25.0           ip-10-0-2-29.ec2.internal
```

> Notice: This article just provides a minimal configuration, not include logical replication, streaming logical replication, backup and restore, etc. We will provide those in another article. You can also refer to [CloudNative-PG](https://cloudnative-pg.io/docs/) for more `Cluster` configuration.

## Connect to PostgreSQL cluster

You can use `kubectl port-forward` to connect to PostgreSQL cluster.

```shell
$ kubectl port-forward services/vchord-rw 5432:5432
$ psql -h 127.0.0.1 -d tensorchord -U tensorchord
ttensorchord=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description                                         
---------+---------+------------+---------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vchord  | 0.4.3   | public     | vchord: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
 vector  | 0.8.0   | public     | vector data type and ivfflat and hnsw access methods
(3 rows)
```

The `vchord` extension is installed successfully. You can try [quick-start](https://docs.vectorchord.ai/vectorchord/getting-started/overview.html#quick-start) without installation.
