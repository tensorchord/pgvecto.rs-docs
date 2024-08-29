# Terraform Integration Overview with PGVecto.rs Cloud

This guide walks you through the process of installing and configuring the PGVetco.rs Cloud provider.

## 1. Prerequisites

Before you begin, ensure you have the following:
1. Terraform Installed: Download and install Terraform from [here](https://www.terraform.io/downloads.html) by following the provided instructions.

2. PGVecto.rs Cloud Account: Access to PGVecto.rs Cloud and your API Key are essential. Go to the [PGVecto.rs Cloud Console](https://cloud.pgvecto.rs) and create an API key. The API key must have the `ProjectOwner` permissions. For more information, see [API Key](./apikey.md).


## 2. Download PGVecto.rs Cloud Terraform Provider

Start by configuring the PGVecto.rs Cloud provider within your Terraform configuration file (`main.tf`). Follow these steps:

```hcl
terraform {
  required_providers {
    pgvecto-rs-cloud = {
      source = "tensorchord/pgvecto-rs-cloud"
    }
  }
}
```

## 3. Initialize Terraform Configuration

Initialize the Terraform configuration by running:

```bash
$ terraform init

Initializing the backend...

Initializing provider plugins...
- Reusing previous version of tensorchord/pgvecto-rs-cloud from the dependency lock file
- Using previously-installed tensorchord/pgvecto-rs-cloud v0.0.2

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

Terraform will download the `pgvecto-rs-cloud` provider and install it in a hidden subdirectory of your current working directory, named `.terraform`.

### 4. Authenticate PGVecto.rs Cloud Terraform Provider

Your PGVecto.rs Cloud API Key is required to use the Terraform Provider. There are two ways to configure this.

#### Option 1: Specify API Key in Provider Block

Append the following code to your `main.tf` file:

```hcl
provider "pgvecto-rs-cloud" {
  api_key = "<your-api-key>"
}
```

Replace `<your-api-key>` with your PGVecto.rs Cloud API Key.

#### Option 2: Use Environment Variable

Set the API key as an environment variable:

```bash
export PGVECTORS_CLOUD_API_KEY="<your-api-key>"
```

Then the provider declaration in your `main.tf` file is simply:

```hcl
provider "pgvecto-rs-cloud" {
}
```

By following these steps, you should have the PGVecto.rs Cloud Terraform provider configured and ready to move on to the next steps.

## Manage PGVecto.rs Cloud Cluster

### Create a Enterprise Plan
The following example demonstrates how to create a PostgreSQL cluster with the Enterprise plan. For more information about the options, refer to the [Resource Schema](https://registry.terraform.io/providers/tensorchord/pgvecto-rs-cloud/latest/docs/resources/cluster).

```hcl
resource "pgvecto-rs-cloud_cluster" "enterprise_plan_cluster" {
  account_id        = "8364ded2-5580-45c4-a394-edfa582e35a0"
  cluster_name      = "enterprise-plan-cluster"
  plan              = "Enterprise"
  server_resource   = "aws-m7i-large-2c-8g"
  region            = "eu-west-1"
  cluster_provider  = "aws"
  database_name     = "test"
  pg_data_disk_size = "10"
}

output "psql_endpoint_enterprise" {
  description = "Endpoint for the PGVecto.rs Cloud Enterprise PostgreSQL database"
  value       = pgvecto-rs-cloud_cluster.enterprise_plan_cluster.connect_endpoint
}
```

```shell
$ terraform validate && terraform plan && terraform output
Success! The configuration is valid.


Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with
the following symbols:
  + create

Terraform will perform the following actions:

  # pgvecto-rs-cloud_cluster.enterprise_plan_cluster will be created
  + resource "pgvecto-rs-cloud_cluster" "enterprise_plan_cluster" {
      + account_id        = "8364ded2-5580-45c4-a394-edfa582e35a0"
      + cluster_name      = "enterprise-plan-cluster"
      + cluster_provider  = "aws"
      + connect_endpoint  = (known after apply)
      + database_name     = "test"
      + id                = (known after apply)
      + pg_data_disk_size = "10"
      + plan              = "Enterprise"
      + region            = "eu-west-1"
      + server_resource   = "aws-m7i-large-2c-8g"
      + status            = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + psql_endpoint = (known after apply)

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Note: You didn't use the -out option to save this plan, so Terraform can't guarantee to take exactly these actions
if you run "terraform apply" now.
╷
│ Warning: No outputs found
│ 
│ The state file either has no outputs defined, or all the defined outputs are empty. Please define an output in
│ your configuration with the `output` keyword and run `terraform refresh` for it to become available. If you are
│ using interpolation, please verify the interpolated value is not empty. You can use the `terraform console`
│ command to assist.
```

```shell
$ terraform apply                                         

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with
the following symbols:
  + create

Terraform will perform the following actions:

  # pgvecto-rs-cloud_cluster.enterprise_plan_cluster will be created
  + resource "pgvecto-rs-cloud_cluster" "enterprise_plan_cluster" {
      + account_id        = "8364ded2-5580-45c4-a394-edfa582e35a0"
      + cluster_name      = "enterprise-plan-cluster"
      + cluster_provider  = "aws"
      + connect_endpoint  = (known after apply)
      + database_name     = "test"
      + id                = (known after apply)
      + pg_data_disk_size = "10"
      + plan              = "Enterprise"
      + region            = "eu-west-1"
      + server_resource   = "aws-m7i-large-2c-8g"
      + status            = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + psql_endpoint = (known after apply)

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Creating...
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [10s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [20s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [30s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [40s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [50s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m0s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m10s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m20s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m30s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m40s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [1m50s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Still creating... [2m0s elapsed]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Creation complete after 2m10s [id=05cd29df-81e9-4ec3-9a98-29c983e6df9b]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

psql_endpoint = "postgres://test_user:DYa6WgKKivWK@enterprise-plan-cluster-xya4v0wspnyr934a.eu-west-1-dev.aws.pgvecto.rs:5432/test?sslmode=require"
```

### Connect to the cluster

```shell
$ psql "postgres://test_user:DYa6WgKKivWK@enterprise-plan-cluster-xya4v0wspnyr934a.eu-west-1-dev.aws.pgvecto.rs:5432/test?sslmode=require"
psql (15.3, server 16.3 (Debian 16.3-1.pgdg110+1))
WARNING: psql major version 15, server major version 16.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
Type "help" for help.

test=> \dx
                                                 List of installed extensions
  Name   | Version |   Schema   |                                         Description
---------+---------+------------+----------------------------------------------------------------------------------------------
 plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
 vectors | 0.3.0   | vectors    | vectors: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
(2 rows)

test=> CREATE TABLE test (id integer PRIMARY KEY, embedding vector(3) NOT NULL);
CREATE TABLE
test=> INSERT INTO test SELECT i, ARRAY[random(), random(), random()]::real[] FROM generate_series(1, 100) i;
INSERT 0 100
test=> CREATE INDEX ON test USING vectors (embedding vector_l2_ops) WITH (options = "[indexing.flat]");
CREATE INDEX
test=> SELECT * FROM test ORDER BY embedding <-> '[0.40671515, 0.24202824, 0.37059402]' LIMIT 10;
 id |               embedding
----+---------------------------------------
  6 | [0.4066231, 0.29105327, 0.23651226]
 35 | [0.46936533, 0.052587368, 0.17850891]
 55 | [0.18655375, 0.31179303, 0.5370203]
 90 | [0.4202515, 0.06740547, 0.12328731]
 66 | [0.54266787, 0.050186355, 0.5889592]
 75 | [0.6677032, 0.39976874, 0.53486466]
 45 | [0.54656297, 0.13819231, 0.06523149]
 87 | [0.08504957, 0.109255746, 0.2677491]
  8 | [0.7345916, 0.31607938, 0.512267]
 69 | [0.0927324, 0.36386836, 0.5159673]
(10 rows)

test=>
```

### Upgrade the cluster

Up to now, we only support upgrading the server resource, plan and disk size. There are some restrictions on the upgrade operation, such as the cpu and memory of the server resource must be greater or equal to the original one, the disk size must be greater or equal to the original one. And the plan upgrade must from the `Starter` to `Enterprise`.

```diff
+ server_resource   = "aws-r7i-large-2c-16g"
- server_resource   = "aws-m7i-large-2c-8g"
+ pg_data_disk_size = "20"
- pg_data_disk_size = "10" 
```

```shell
$ terraform apply
```

### Destroy the cluster

```shell
$ terraform destroy
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Refreshing state... [id=05cd29df-81e9-4ec3-9a98-29c983e6df9b]

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with
the following symbols:
  - destroy

Terraform will perform the following actions:

  # pgvecto-rs-cloud_cluster.enterprise_plan_cluster will be destroyed
  - resource "pgvecto-rs-cloud_cluster" "enterprise_plan_cluster" {
      - account_id        = "8364ded2-5580-45c4-a394-edfa582e35a0" -> null
      - cluster_name      = "enterprise-plan-cluster" -> null
      - cluster_provider  = "aws" -> null
      - connect_endpoint  = "postgres://test_user:DYa6WgKKivWK@enterprise-plan-cluster-xya4v0wspnyr934a.eu-west-1-dev.aws.pgvecto.rs:5432/test?sslmode=require" -> null
      - database_name     = "test" -> null
      - id                = "05cd29df-81e9-4ec3-9a98-29c983e6df9b" -> null
      - pg_data_disk_size = "10" -> null
      - plan              = "Enterprise" -> null
      - region            = "eu-west-1" -> null
      - server_resource   = "aws-m7i-large-2c-8g" -> null
      - status            = "Ready" -> null
    }

Plan: 0 to add, 0 to change, 1 to destroy.

Changes to Outputs:
  - psql_endpoint = "postgres://test_user:DYa6WgKKivWK@enterprise-plan-cluster-xya4v0wspnyr934a.eu-west-1-dev.aws.pgvecto.rs:5432/test?sslmode=require" -> null

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes

pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Destroying... [id=05cd29df-81e9-4ec3-9a98-29c983e6df9b]
pgvecto-rs-cloud_cluster.enterprise_plan_cluster: Destruction complete after 1s
```
