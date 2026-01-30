# Kubernetes

If you want to use `vectorchord` in PostgreSQL which is running in Kubernetes, we provide a tutorial to help you. In this tutorial, we will use [CloudNative-PG](https://cloudnative-pg.io/) to deploy PostgreSQL cluster in Kubernetes.

## Requirements

| Name | Version |
|------|---------|
| [helm](https://helm.sh/) | >= 2.4.1 |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | >= 1.14 |
| [Kubernetes](https://kubernetes.io/) | >= 1.24.0 |
| [Kubernetes (Image Volume Extensions)](https://kubernetes.io/) | >= 1.31.0 |

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
    - "vchord"
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
tensorchord=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description                                         
---------+---------+------------+---------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vchord  | 1.0.0   | public     | vchord: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
 vector  | 0.8.1   | public     | vector data type and ivfflat and hnsw access methods
(3 rows)
```

The `vchord` extension is installed successfully. You can try [quick-start](https://docs.vectorchord.ai/vectorchord/getting-started/overview.html#quick-start) without installation.


## Lightweight Extension Images

Managing extensions is one of the biggest challenges when running PostgreSQL on Kubernetes. If you want to add a new extension to [this image](#postgresql-image-with-vectorchord), you must rebuild the image, back up your PostgreSQL cluster, apply the new image with the added extension, and then restore the cluster. This process reflects the concept of immutable containers in Kubernetes.

Thanks to Andrew Dunstan and Matheus Alcantara, a [proposal for PostgreSQL 18](https://commitfest.postgresql.org/patch/4913/) introduces a new configuration option (GUC), extension_control_path, which allows users to specify additional directories for extension control files.

For Kubernetes, the [ImageVolume feature](https://kubernetes.io/blog/2024/08/16/kubernetes-1-31-image-volume-source/) allows us to mount a container image as a read-only and immutable volume inside a running pod. This enables PostgreSQL extensions packaged as independent OCI-compliant container images to be mounted inside CloudNativePG clusters at a known directory.

Based on these two features, we can create lightweight `vectorchord` extension image [vchord-scratch](https://github.com/tensorchord/VectorChord-images/pkgs/container/vchord-scratch).

:::tip
If you want to use [`Image Volume Extensions`](https://cloudnative-pg.io/docs/1.28/imagevolume_extensions/), you need to meet the following requirements:
- Use Kubernetes version 1.31.0 or above (1.33.0 is recommended), and make sure the `ImageVolume` feature gate is enabled.
- Use CloudNative-PG helm chart version 0.26.0 or above.
:::

### Create PostgreSQL cluster with Image Volume Extensions

You can use the following sample yaml file to create a PostgreSQL cluster with `vectorchord` extension image. You can modify it according to your needs. You need pay attention to the following points:
- Set `shared_preload_libraries` to load `vchord` shared library.
- Execute `CREATE EXTENSION IF NOT EXISTS vchord CASCADE;` to create `vchord` extension.
- Set `extensions` to specify the `vchord-scratch` extension image. 
- Set `extension_control_path` and `dynamic_library_path` to specify the paths of extension control files and shared library files.

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
  imageName: ghcr.io/cloudnative-pg/postgresql:18-system-bookworm
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
  postgresql:
    extensions:
      - name: vchord
        image:
          reference: ghcr.io/tensorchord/vchord-scratch:pg18-v1.0.0
        dynamic_library_path:
          - /usr/lib/postgresql/18/lib/
        extension_control_path:
          - /usr/share/postgresql/18/
    shared_preload_libraries:
    - "vchord"
```

We can check the extension is already installed successfully.

```shell
$ kubectl port-forward services/vchord-rw 5432:5432
$ psql -h
$ psql -h 0.0.0.0 -U tensorchord -d tensorchord
Password for user tensorchord: 
psql (13.3 (Ubuntu 13.3-1.pgdg16.04+1), server 18.0 (Debian 18.0-1.pgdg12+3))
WARNING: psql major version 13, server major version 18.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

tensorchord=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description                                         
---------+---------+------------+---------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vchord  | 1.0.0   | public     | vchord: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
 vector  | 0.8.1   | public     | vector data type and ivfflat and hnsw access methods
(3 rows)

```

:::warning
The image `ghcr.io/cloudnative-pg/postgresql:18-system-bookworm` already contains pgvector, which is required for vchord. However, this image may not include pgvector in future versions, but we have not seen this trend in the short term. 
:::