# Quick Start

This guide will help you get started with pgvecto.rs Cloud. First, you need to sign up for a pgvecto.rs Cloud account. If you haven't done so already, you can sign up for a free account [here](../getting-started/sign-up.md).

## Create a cluster

To create a new cluster, navigate to the pgvecto.rs Cloud Console and click on the "Create Cluster" button.

![](../images/after_login_in.png)

You need to specify the following information:
- **Cluster Name**: A unique name for your cluster.
- **Plan**: The plan you want to use for your cluster, for information about Cloud's paid plan options, see [Cloud plans](../pricing/price-plan).
- **Cloud Provider**: The cloud provider where your cluster will be deployed.
- **Region**: The region where your cluster will be deployed.
- **Database Name**: The name of the database that you will store vector data in. 

![](../images/create_cluster.png)

## Cluster Info 

After creating a cluster, you will be directed to the cluster info page. Here you can find the details of your cluster, such as the connection string, the status of the cluster, and resource usage of the cluster.

![](../images/cluster_info.png)

We provide two types of connection endpoints:
- Super User Endpoint: This connection string is used to connect to the cluster as a superuser(postgres). You can use this connection string to create databases, users, and manage the cluster.
- Vector User Endpoint: This connection string is used to connect to the cluster as a vector user. You can use this connection string to store and query vector data.

![](../images/two_types_connections.png)

## Connect to the cluster

To connect to the cluster, you can use the provided connection strings. You can connect to the cluster using the `psql` command-line tool. For detailed instructions on how to connect to the cluster, see [Connect to pgvecto.rs Cloud with psql](../connect/connect-with-psql.md). After connecting to the cluster, we can execute the following SQL query `dx` to validate you have successfully installed the vectors extension.

```shell
$ psql 'postgres://vector_user:56Cu2dtBt8WI@test-prgg3conlto0iayt.modelz.tech:5432/vector?sslmode=require'
psql (15.3, server 16.2 (Debian 16.2-1.pgdg110+2))
WARNING: psql major version 15, server major version 16.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
Type "help" for help.

vector=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vectors | 0.2.1   | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
(2 rows)
```

## Create Index

In quick start, we will create a simple index. If you want to create a more advanced index, see [Reference](../../reference/). We provide rich user cases, see [Use Cases](../../use-case/). 

```sql

vector=> CREATE TABLE test (id integer PRIMARY KEY, embedding vector(3) NOT NULL);
CREATE TABLE
vector=> INSERT INTO test SELECT i, ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 100) i;
INSERT 0 100
vector=> CREATE INDEX ON test USING vectors (embedding vector_l2_ops) WITH (options = "[indexing.flat]");
CREATE INDEX
vector=> SELECT * FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402]' LIMIT 10;
 id |              embedding
----+--------------------------------------
 22 | [0.4550096, 0.15745035, 0.26764277]
 19 | [0.45290792, 0.3833989, 0.3400999]
 20 | [0.28304976, 0.37050676, 0.2509808]
 63 | [0.3650842, 0.2542893, 0.5892761]
 38 | [0.52051926, 0.09817826, 0.17111313]
 17 | [0.39168102, 0.45760015, 0.19123259]
 60 | [0.12486037, 0.22900634, 0.40918347]
 18 | [0.14194076, 0.17346346, 0.2288747]
 66 | [0.5948386, 0.36225688, 0.13597152]
 44 | [0.7209442, 0.27641752, 0.49930736]
(10 rows)
```

## Monitoring

You can view the cpu and memory usage of your cluster in the cluster info page, and you can also view the index info for example the number of vectors in the index, the dimension of the vectors etc. For detailed information about monitoring, see [Monitoring](../monitoring/monitoring.md).

![](../images/monitoring.png)