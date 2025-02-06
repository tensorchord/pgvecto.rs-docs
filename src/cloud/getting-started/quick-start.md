# Quick Start

This guide will help you get started with VectorChord Cloud. First, you need to sign up for a VectorChord Cloud account. If you haven't done so already, you can sign up for a free account [here](../getting-started/sign-up.md).

## Create a cluster

::: tip
You can only create Enterprise plan after you bind a [credit card](../payment/credit-card.md).
:::

![](../images/after_login_in.png)

To create a new cluster, navigate to the VectorChord Cloud Console and click on the "Create Cluster" button.

![](../images/create_cluster.png)

You need to specify the following information:
- Required:
  - **Plan**: The plan you want to use for your cluster, for information about Cloud's paid plan options, see [Cloud plans](../pricing/price-plan).
  - **Cluster Name**: A unique name for your cluster.
  - **Extension Settings**:
    - **Extension**: We support two Vector Search extensions, [pgvectors](https://github.com/tensorchord/pgvecto.rs) and its successor [vectorchord](https://github.com/tensorchord/VectorChord)
      - **vectorchord**: Scalable, Fast, and Disk-friendly Vector search in Postgres
      - **pgvectors**: Scalable, Low-latency and Hybrid-enabled Vector Search in Postgres. Revolutionize Vector Search, not Database.
      :::warning
      The vectorchord only support server resource with NVMe SSD.
      :::
    - **Image**: 
      - VectorChord, we provide a tag in a semantic version format, for example 16-v0.1.0:
        - 16 indicates the version number of Postgres major
        - v0.1.0 indicates VectorChord version number
      - pgvecto.rs, we provide a tag in a semantic version format, for example 16-v0.4.0-vectors-exts:
        - 16 indicates the version number of Postgres major
        - v0.4.0 indicates pgvecto.rs version number
        - vectors indicates the installation location of pgvecto.rs scheme, optional vectors,extensions, public. Please choose public if you want to use VectorChord Cloud on AWS RDS. If you're going to use fdw on Supabase, please choose extensions.
        - exts indicates the cluster can install extensions from https://pgt.dev/.
  - **Cloud Provider Settings**:
    - **Cloud Provider**: The cloud provider where your cluster will be deployed, currently only AWS is supported.
    - **Region**: The region where your cluster will be deployed.
  - **Resource Settings**:
    - **Type**: We provide two types of resources, `Performance` and `Capacity`.
    - **Server Resource**:
      - **Performance**:
        - **1C/2G**: Free tier, 1 core CPU, 2GB memory and 3Gi disk space.
        - **2C/8G**: Enterprise tier, 2 core CPU, 8GB memory and 15Gi disk space.
        - **2C/16G**: Enterprise tier, 2 core CPU, 16GB memory and 15Gi disk space.
        - **4C/32G**: Enterprise tier, 4 core CPU, 32GB memory and 90Gi disk space.
      - **Capacity**:
        - **4C/32G NVMe SSD**: Enterprise tier, 4 core CPU, 32GB memory and 850Gi NVMe SSD disk space.
  - **Postgres Settings**:
    - **Database Name**: The name of the database that you will store vector data in. 
    - **Enable Connection Pooler**: (default: false): Enable the connection pooler for your cluster.
    - **Enable Restore Config**: (default: false): Enable the restore config for your backup created in other clusters. 
    - **Optional**:
      - **Disk Size**: Postgres PGData disk size, will change the default disk size.
      - **Instances**: The number of instances in the cluster. The default is 1. 
      ::: warning
      Currently, vector index not support streaming replication.
      :::

## Cluster Info 

After creating a cluster, you will be directed to the cluster info page. Here you can find the details of your cluster, such as the connection string, the status of the cluster, and resource usage of the cluster.

![](../images/cluster_info.png)

We provide two types of connection endpoints, `Super User Endpoint` and `Vector User Endpoint` respectively. For more information about the two types of connections, see [Connecting with psql](../connect/connect-with-psql.md).

![](../images/two_types_connections.png)

If `Enable Connection Pooler` is selected when create cluster, you can get the pooler connection endpoint via clicking the `Show Pooler Endpoint` button.

![](../images/two_types_pooler_connections.png)

## Connect to the cluster

To connect to the cluster, you can use the provided connection strings. You can connect to the cluster using the `psql` command-line tool. For detailed instructions on how to connect to the cluster, see [Connect to VectorChord Cloud with psql](../connect/connect-with-psql.md). After connecting to the cluster, we can execute the following SQL query `\dx` to validate you have successfully installed the vectors extension.

```shell
$ psql 'postgres://test_user:vaBgs6CcrtMu@test-f5ys31pvbca4x6f9.us-east-1-dev.aws.vectorchord.com:5432/test?sslmode=require'
psql (15.3, server 16.5)
WARNING: psql major version 15, server major version 16.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
Type "help" for help.

test=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description
---------+---------+------------+----------------------------------------------------------------------------------------------
 pgaudit | 16.0    | public     | provides auditing functionality
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vectors | 0.4.0   | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
(3 rows)
```

## Create Index

In quick start, we will create a simple index. If you want to create a more advanced index, see [Reference](../../reference/). We provide rich user cases, see [Use Cases](../../use-case/). 

```sql
test=> CREATE TABLE test (id integer PRIMARY KEY, embedding vector(3) NOT NULL);
CREATE TABLE
test=> INSERT INTO test SELECT i, ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 100) i;
INSERT 0 100
test=> CREATE INDEX ON test USING vectors (embedding vector_l2_ops) WITH (options = "[indexing.hnsw]");
CREATE INDEX
test=> SELECT * FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402]' LIMIT 10;
 id |              embedding
----+--------------------------------------
 53 | [0.49730784, 0.3848221, 0.28655913]
 19 | [0.54001766, 0.40314186, 0.44689152]
 62 | [0.6388231, 0.20029141, 0.34409937]
 97 | [0.5666403, 0.24310996, 0.1873124]
 30 | [0.21831545, 0.31599918, 0.21045132]
 10 | [0.5354302, 0.44377843, 0.26784408]
 48 | [0.19506525, 0.3632655, 0.24503356]
 76 | [0.283386, 0.5032842, 0.32678106]
 35 | [0.23225804, 0.051908802, 0.5431633]
 56 | [0.5288183, 0.28127462, 0.078518875]
(10 rows)
```

## Monitoring

You can view the cpu utilization, memory usage and PGData disk total and usage of your cluster in the metrics page. And you can also view the index info for example the number of vectors in the index, the dimension of the vectors etc. For detailed information about monitoring, see [Monitoring](../monitoring/monitoring.md).
![](../images/monitoring.png)