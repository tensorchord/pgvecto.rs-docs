# LangChain

This document describes the LangChain integration.

LangChain is a framework for developing applications powered by language models. It is a set of tools that allows you to fine-tune, deploy, and use language models in production.

`pgvecto.rs` provides a LangChain integration that allows you to retrieve the most similar vectors in LangChain.

## Install dependencies

Some dependencies are required to use the LangChain integration:

```sh
pip install langchain langchain-openai pgvecto-rs
```

You could start the postgres instance with `pgvecto.rs` extension in a docker container:

```sh
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.1.13
```

Then you can connect to the database using the `psql` command line tool. The default username is `postgres`, and the default password is `mysecretpassword`.

```sh
psql postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

Run the following SQL to ensure the extension is enabled.

```sql
DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;
```

## Create the database and load documents

We will show how to use `pgvecto.rs` in LangChain to retrieve the most similar vectors. 

First, you need to create the text loader and the text splitter to split the text into chunks. We use the markdown file [pgvecto.rs-docs/src/getting-started/overview.md](https://github.com/tensorchord/pgvecto.rs-docs/blob/main/src/getting-started/overview.md) as an example.

```python
## Loading Environment Variables
from dotenv import load_dotenv

load_dotenv()

from langchain.docstore.document import Document
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores.pgvecto_rs import PGVecto_rs
from langchain_openai import OpenAIEmbeddings


loader = TextLoader("./src/getting-started/overview.md")
documents = loader.load()
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
```

Then, we will create the `PGVecto_rs` instance and load the documents into the database.

```python
## PGVecto.rs needs the connection string to the database.
## We will load it from the environment variables.
import os

PORT = os.getenv("DB_PORT", 5432)
HOST = os.getenv("DB_HOST", "localhost")
USER = os.getenv("DB_USER", "postgres")
PASS = os.getenv("DB_PASS", "mysecretpassword")
DB_NAME = os.getenv("DB_NAME", "postgres")

# Run tests with shell:
URL = "postgresql+psycopg://{username}:{password}@{host}:{port}/{db_name}".format(
    port=PORT,
    host=HOST,
    username=USER,
    password=PASS,
    db_name=DB_NAME,
)

# The pgvectors Module will try to create a table with the name of the collection.
# So, make sure that the collection name is unique and the user has the permission to create a table.

COLLECTION_NAME = "state_of_the_union_test"

db = PGVecto_rs.from_documents(
    embedding=embeddings,
    documents=docs,
    collection_name=COLLECTION_NAME,
    db_url=URL,
)
```

## Query

Finally, we can retrieve the most similar vectors in LangChain.

```python
query = "What is pgvecto.rs"
docs_with_score = db.similarity_search_with_score(query)

for doc, score in docs_with_score:
    print("-" * 80)
    print("Score: ", score)
    print(doc.page_content)
    print("-" * 80)
```

The output is:

```text
Created a chunk of size 1181, which is longer than the specified 1000
--------------------------------------------------------------------------------
Score:  0.25059962
# Overview

An introduction to the pgvecto.rs.

## What is pgvecto.rs

pgvecto.rs is a Postgres extension that provides vector similarity search functions. It is written in Rust and based on [pgrx](https://github.com/tcdi/pgrx). It is currently in the beta status, we invite you to try it out in production and provide us with feedback. Read more at [📝our launch blog](https://modelz.ai/blog/pgvecto-rs).

## Why use pgvecto.rs
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
Score:  0.29536954
- 💃 **Easy to use**: pgvecto.rs is a Postgres extension, which means that you can use it directly within your existing database. This makes it easy to integrate into your existing workflows and applications.
- 🔗 **Async indexing**: pgvecto.rs's index is asynchronously constructed by the background threads and does not block insertions and always ready for new queries.
- 🥅 **Filtering**: pgvecto.rs supports filtering. You can set conditions when searching or retrieving points. This is the missing feature of other postgres extensions.
- 🧮 **Quantization**: pgvecto.rs supports scalar quantization and product qutization up to 64x.
- 🦀 **Rewrite in Rust**: Rust's strict compile-time checks ensure memory safety, reducing the risk of bugs and security issues commonly associated with C extensions.

## Comparison with pgvector
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
Score:  0.35845917
More details at [📝`pgvecto.rs` vs. pgvector](/faqs/comparison-pgvector.md).

## Quick start

For new users, we recommend using the [Docker image](https://hub.docker.com/r/tensorchord/pgvecto-rs) to get started quickly.
...
```

## Initialize from an existing database

Above, we created a vector store from scratch. However, often times we want to work with an existing vector store. In order to do that, we can initialize it directly.

```python
db = PGVecto_rs(
    embedding=embeddings,
    collection_name=COLLECTION_NAME,
    # OpenAI embedding has 1536 dimensions.
    dimension=1536,
    db_url=URL,
)
```

Then, we can add vectors to the store and query:

```python
db.add_documents([Document(page_content="foo")])
docs_with_score = db.similarity_search_with_score("foo")
print(docs_with_score[0])
```

The output is:

```text
(Document(page_content='foo'), 0.0)
```

<style>
code {
  white-space: pre-wrap !important;
  counter-reset: step;
  counter-increment: step 0;
  min-width: calc(100% - 40px) !important;
}

.line::before {
  content: counter(step);
  counter-increment: step;
  width: 2ch;
  margin-right: 36px;
  margin-left: calc(-36px - 2ch);
  display: inline-block;
  text-align: right;
  color: var(--vp-code-line-number-color);
}
</style>
