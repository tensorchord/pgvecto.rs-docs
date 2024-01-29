# LlamaIndex

LlamaIndex is a simple, flexible data framework for connecting custom data sources to large language models (LLMs).

`pgvecto.rs` provides a LlamaIndex integration that allows you to retrieve the most similar vectors.

## Install dependencies

Some dependencies are required to use the LlamaIndex integration:

```sh
pip install llama-index "pgvecto_rs[sdk]"
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

First, create the text loader and the text splitter to split the text into chunks. We use the markdown file [pgvecto.rs-docs/src/getting-started/overview.md](https://github.com/tensorchord/pgvecto.rs-docs/blob/main/src/getting-started/overview.md) as an example.

```python
import logging
import os
import sys

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))

from pgvecto_rs.sdk import PGVectoRs

URL = "postgresql+psycopg://{username}:{password}@{host}:{port}/{db_name}".format(
    port=os.getenv("DB_PORT", "5432"),
    host=os.getenv("DB_HOST", "localhost"),
    username=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASS", "mysecretpassword"),
    db_name=os.getenv("DB_NAME", "postgres"),
)

client = PGVectoRs(
    db_url=URL,
    collection_name="example",
    dimension=1536,  # Using OpenAI’s text-embedding-ada-002
)
```

Then setup the OpenAI API key and load the documents into the database.

```python
import os

os.environ["OPENAI_API_KEY"] = "sk-..."

from llama_index import SimpleDirectoryReader, VectorStoreIndex
from llama_index.vector_stores import PGVectoRsStore

# load documents
documents = SimpleDirectoryReader("./src/getting-started/overview.md").load_data()

# initialize without metadata filter
from llama_index.storage.storage_context import StorageContext

vector_store = PGVectoRsStore(client=client)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_documents(
    documents, storage_context=storage_context
)
```

### Query index

Finally, we can retrieve the most similar chunks.

```python
# set Logging to DEBUG for more detailed outputs
query_engine = index.as_query_engine()
response = query_engine.query("What did the author do growing up?")
```
