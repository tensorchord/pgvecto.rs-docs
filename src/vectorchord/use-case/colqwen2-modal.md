# Beyond Text: Unlock OCR-Free RAG in PostgreSQL with Modal & VectorChord

Building effective Retrieval-Augmented Generation (RAG) systems for documents often feels like wrestling with messy, complex pipelines. Especially when dealing with PDFs or scanned images, traditional methods rely heavily on Optical Character Recognition (OCR) and layout analysis. These steps can be slow, error-prone, and often lose crucial visual context like tables, figures, and formatting. **But what if you could query documents based on *how they look*, not just the extracted text?**

This post is your guide to building exactly that: an **OCR-free RAG system** directly within your familiar PostgreSQL database. We'll leverage the power of the **ColQwen2** Vision Language Model, the efficiency of **VectorChord** for multi-vector search in Postgres, and the scalability of **Modal** for GPU-powered embedding generation. Get ready to simplify your RAG stack and potentially boost your retrieval accuracy, all without complex pre-processing.

We'll cover:

* What ColQwen2 is and why it's a game-changer.

* How VectorChord makes advanced vector search possible in Postgres.

* A step-by-step tutorial to build and evaluate the system.


## What is ColQwen2? The Power of Visual Understanding

To grasp ColQwen2, let's first look at its foundation: **ColPali**. As introduced in the paper "[**ColPali: Efficient Document Retrieval with Vision Language Models**](https://arxiv.org/abs/2407.01449)", ColPali represents a novel approach using Vision Language Models (VLMs). Instead of relying on imperfect OCR, it directly indexes documents using their rich **visual features** – text, images, tables, layout, everything the eye can see.

Think about the limitations of traditional OCR: complex layouts get mangled, tables become gibberish, and images are often ignored entirely. It's like trying to understand a book by only reading a flawed transcript. ColPali avoids this by using a powerful VLM (originally PaliGemma) to create embeddings that capture the document's holistic visual nature. Two key concepts make it shine:

1. **Contextualized Vision Embeddings:** Generating rich embeddings directly from the document image using a VLM.

2. **Late Interaction:** This clever technique allows the *query's* textual meaning to directly interact with the *document's* detailed visual features *at search time*. It's not just matching text summaries; it's comparing the query concept against the visual evidence within the document page.

<img src="https://cdn-uploads.huggingface.co/production/uploads/60f2e021adf471cbdf8bb660/La8vRJ_dtobqs6WQGKTzB.png" alt="ColPali Architecture" width="600" height="400"/>


> T*he ColPali architecture (Image from the ColPali paper)*

**ColQwen2** builds upon this powerful ColPali architecture but swaps the underlying VLM for the more recent **Qwen2-VL-2B**. It generates [**ColBERT**\-style](https://arxiv.org/abs/2004.12832) multi-vector representations, capturing fine-grained details from both text and images. As seen on the [**vidro-leaderboard**,](https://huggingface.co/spaces/vidore/vidore-leaderboard) ColQwen2 delivers impressive performance with practical model size.

## How Does VectorChord Enable ColQwen2 in Postgres?

This is where **VectorChord** becomes the crucial piece of the puzzle, bringing this cutting-edge VLM capability into your PostgreSQL database. ColQwen2 (and ColPali) relies heavily on those **multi-vector representations** and the **Late Interaction** mechanism, specifically requiring an efficient **MaxSim (Maximum Similarity)** operation.

Calculating MaxSim – finding the highest similarity score between any vector in the query set and any vector in the document set – can be computationally brutal, especially across millions of document vectors. VectorChord tackles this head-on:

* **Native Multi-Vector Support:** It's designed from the ground up to handle multi-vector data efficiently within Postgres.

* **Optimized MaxSim:** Drawing inspiration from the [**WARP paper**](https://arxiv.org/abs/2501.17788), VectorChord uses techniques like dynamic similarity imputation to dramatically speed up MaxSim calculations, making large-scale visual document retrieval feasible.

* **Hybrid Search Ready:** Beyond multi-vector, it also supports dense, sparse, and hybrid search (check out our [**previous post**](https://blog.vectorchord.ai/hybrid-search-with-postgres-native-bm25-and-vectorchord)!).

* **Scalable & Disk-Friendly:** Designed for performance without demanding excessive resources.


In short, VectorChord transforms PostgreSQL into a powerhouse capable of handling the advanced vector search techniques required by models like ColQwen2 or ColPali.

## Tutorial: Building Your OCR-Free RAG System

Alright, theory's great, but let's roll up our sleeves and build this thing! We'll walk through setting up the environment, processing data using Modal for scalable embedding generation, indexing into VectorChord within Postgres, and finally, evaluating our shiny new OCR-free RAG system.

### Prerequisites

Before we start, ensure you have:

* A PostgreSQL instance (Docker recommended) with the VectorChord extension installed OR a [**VectorChord Cloud**](https://cloud.vectorchord.ai/) cluster.

* A [**Modal**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fmodal.com%2F) account (free tier available). Modal's fast GPU provisioning and scaling are perfect for the embedding generation step. To efficiently process a large volume of documents using the ColQwen2 model, it's crucial to leverage Modal's rapid startup and GPU expansion features. This approach will significantly reduce the time required for local processing.


If you want to reproduce the tutorial quickly, you can use the `tensorchord/vchord-suite` image to run multiple extensions that TensorChord provides.

You can run the following command to build and start Postgres with VectorChord-BM25 and VectorChord.

```bash
docker run \
  --name vchord-suite \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d tensorchord/vchord-suite:pg17-latest
```

```SQL
CREATE EXTENSION IF NOT EXISTS vchord CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_tokenizer CASCADE;
CREATE EXTENSION IF NOT EXISTS vchord_bm25 CASCADE;
\dx
pg_tokenizer | 0.1.0   | tokenizer_catalog | pg_tokenizer
vchord       | 0.3.0   | public            | vchord: Vector database plugin for Postgres, written in Rust, specifically designed for LLM
vchord_bm25  | 0.2.0   | bm25_catalog      | vchord_bm25: A postgresql extension for bm25 ranking algorithm
vector       | 0.8.0   | public            | vector data type and ivfflat and hnsw access methods
```

Set up Modal:

```bash
$ pip install modal
$ python3 -m modal setup  # click the link to authorize
```

### Step 1: Load the Data (Using Modal Volumes)

We'll use the [**ViDoRe Benchmark**](https://huggingface.co/collections/vidore/vidore-benchmark-667173f98e70a1c0fa4db00d) dataset. To handle this data efficiently across potentially distributed Modal functions, we'll download it to a [**Modal Volume**](https://modal.com/docs/guide/volumes). Volumes provide persistent, shared storage ideal for this 'download once, process many times' scenario.

```python
image = modal.Image.debian_slim().pip_install("datasets","huggingface_hub","Pillow")
DATASET_DIR = "/data"
DATASET_VOLUME  = modal.Volume.from_name(
    "colpali-dataset", create_if_missing=True
)
app = modal.App(image=image)

@app.function(volumes={DATASET_DIR: DATASET_VOLUME}, timeout=3000)
def download_dataset(cache=False) -> None:
    from datasets import load_dataset
    from tqdm import tqdm

    collection_dataset_names = get_collection_dataset_names("vidore/vidore-benchmark-667173f98e70a1c0fa4db00d")
    for dataset_name in tqdm(collection_dataset_names, desc="vidore benchmark dataset(s)"):
        dataset = load_dataset(dataset_name, split="test",num_proc=10)
        unique_indices = dataset.to_pandas().drop_duplicates(subset="image_filename", keep="first").index #to remove repeating PDF pages with different queries
        dataset = dataset.select(unique_indices)
        dataset.save_to_disk(f"{DATASET_DIR}/{dataset_name}")
```

Modal offers a straightforward Python API for interacting with its platform. With `modal.Image`, you can set the base image for the Modal App, and the `function` decorator helps define the function to be executed within the Modal application. To download the dataset to the Modal Volume, execute the following command. Modal will then automatically build the Docker image and promptly launch the container to run your function.

Run the download function:

```bash
$ modal run dataset.py::download_dataset
```

Modal handles building the environment and running the script in the cloud.

### Step 2: Process Data & Generate Embeddings (With Modal & ColQwen2)

This is the heavy lifting: converting document images into ColQwen2 multi-vector embeddings. Doing this locally for many documents would be slow. Modal shines here:

* **Easy GPU Access & Autoscaling**: Launch a ColQwen2 model service on Modal and use it to generate the image embeddings and query embeddings for the dataset. The decision to implement an HTTP service instead of using the SDK directly was made to ensure seamless auto-scaling during large-scale embedding operations. If you want to deploy the embedding service as a persistent web endpoint, you can directly change `modal.cls` to `modal.web_server` for ColPaliServer and running `modal deploy`.

* **Recovery:** We checkpoint progress to a separate Modal Volume, allowing us to resume embedding generation if interrupted.


```python
# embedding.py (Illustrative - keep original code)
# ... imports, volumes setup ...
modal_app = modal.App() # Define app

# Function to coordinate embedding generation
@modal_app.function(...)
def embed_dataset(down_scale: float = 1.0, batch_size: int = BATCH_SIZE):
    # ... (logic for loading dataset names, handling checkpoints) ...
    colpali_server = ColPaliServer() # Get handle to our GPU class
    # ... (loop through datasets, batch items, call server for embeddings) ...
    # ... (save embeddings and update checkpoint) ...
    print("Embedding generation complete.")

# server.py (Illustrative - keep original code)
# Class running on GPU to serve embedding requests
@modal_app.cls(gpu=GPU_CONFIG, ...)
class ColPaliServer:
    @modal.enter()
    def load_model_and_start_server(self):
        # ... (Load ColQwen2 model, start internal FastAPI server) ...
        self.client = httpx.AsyncClient(...) # Client to talk to internal server

    @modal.exit()
    def shutdown_server(self):
        # ... (Cleanup) ...

    # Method called by embed_dataset function
    @modal.method()
    async def embed_images(self, images: List[str]) -> np.ndarray:
        # ... (Prepare batch, send request to internal server via self.client) ...
        # ... (Decode response using msgspec for speed) ...
        return embeddings_numpy_array

    # ... (Potentially add embed_queries method too) ...

# colpali.py
class ColPaliModel:
    def __init__(self, model_name: str = "vidore/colqwen2-v1.0", cache_dir: str="/model"):
        # ...
        if self.model_name == "vidore/colqwen2-v1.0":
            from colpali_engine.models import ColQwen2, ColQwen2Processor
            from transformers.utils.import_utils import is_flash_attn_2_available

            # load model
            model = ColQwen2.from_pretrained(
                self.model_name,
                torch_dtype=torch.bfloat16,
                device_map="cuda:0",
                attn_implementation="flash_attention_2" if is_flash_attn_2_available() else None,
                cache_dir=self.cache_dir,
            ).eval()

            colpali_processor = ColQwen2Processor.from_pretrained(
                self.model_name,
                cache_dir=self.cache_dir,
            )
    # ... functions for embedding images and queries
    # @modal.method()
    # async def batch_embed_images(self, images_base64: List[str]) -> np.ndarray:
    # @modal.method()
    # async def batch_embed_queries(self, queries: List[str]) -> np.ndarray:
```

Generate the embeddings:

```bash
$ modal run embedding.py::embed_dataset
```

### Step 3: Create Index in VectorChord (Using Vechord SDK)

With embeddings generated and saved in a Modal Volume, we first need to bring them local.

```bash
$ modal volume get colpali-embedding-checkpoint /path/to/local/vidore_embeddings
```

Now, we'll use the **vechord** SDK to load these embeddings into our PostgreSQL database and create the necessary multi-vector index. vechord provides a Pythonic, ORM-like way to interact with VectorChord in Postgres.

%[https://github.com/tensorchord/vechord]

```python
MultiVector = List[Vector[128]] # Assuming 128 dimensions for ColQwen2

lists = 2500 # lists is the number of the cluster
# Define the database table schema using vechord
class Image(Table, kw_only=True):
    uid: Optional[PrimaryKeyAutoIncrease] = None
    image_embedding: Annotated[MultiVector, MultiVectorIndex(lists=lists)] # Stores the document's visual embeddings
    query_embedding: Annotated[MultiVector, MultiVectorIndex(lists=lists)]  # Stores the query's embeddings
    query: str = None
    dataset: Optional[str] = None
    dataset_id: Optional[int] = None

# Connect to your PostgreSQL database
# Ensure the URL points to your local Docker or VectorChord Cloud instance
DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/postgres" # Default DB
vr = VechordRegistry("colpali", DB_URL)
vr.register([Image]) # Creates the table and multi-vector index if they don't exist

# Function to load embeddings from disk and yield Image objects
@vr.inject(output=Image)
def load_image_embeddings(path: str) -> Iterator[Image]:
    # ... (logic to load numpy arrays from disk, convert to List[Vector]) ...
    # ... (yield Image(...) instances) ...
    print(f"Loaded embeddings from {path}")

if __name__ == "__main__":
    # Path where you downloaded the embeddings from Modal
    embedding_dir = "/path/to/local/vidore_embeddings"
    load_image_embeddings(embedding_dir) # This triggers vechord to insert data
    print("Data loaded and indexed into VectorChord.")
```

Run the indexer script, vechord handles table creation, index creation, and data insertion.

### Step 4: Evaluation - Does it Work?

The final step is crucial: evaluating retrieval performance. Does this OCR-free system deliver accurate results, and can it be fast? We'll use vechord to run queries against our indexed data and look at NDCG@10 and Recall@10. We'll also test the impact of VectorChord's **WARP optimization**, which accelerates MaxSim calculations. In this tutorial, we will use [vidore/arxivqa\_test\_subsampled](https://huggingface.co/datasets/vidore/arxivqa_test_subsampled) dataset for evaluation queries, the data are shown below.

<img src="../images/arxivqa-dataset.jpeg" alt="Evaluation Queries" width="600" height="400"/>

```python
TOP_K = 10

# Define structure for results (optional but good practice)
class Evaluation(msgspec.Struct):
    map: float
    ndcg: float
    recall: float

TOP_K = 10
def evaluate(queries: list[Image], probes: int, max_maxsim_tuples: int) -> list[Evaluation]:
    result  = []
    for query in queries:
        vector = query.query_embedding
        docs: list[Image] = vr.search_by_multivec(
            Image, vector, topk=TOP_K, probe=probes, max_maxsim_tuples=max_maxsim_tuples
        )
        score = BaseEvaluator.evaluate_one(query.uid, [doc.uid for doc in docs])
        result.append(Evaluation(
            map=score.get("map"),
            ndcg=score.get("ndcg"),
            recall=score.get(f"recall_{TOP_K}"),
        ))
    return result

if __name__ == "__main__":
    # Select some queries from the benchmark dataset stored in the DB
    # Example: Get 100 queries from a specific subset
    test_queries: list[Image] = vr.select_by(
        Image.partial_init(dataset="vidore/arxivqa_test_subsampled"), limit=100
    )

    # ... optimize the param ...
    res: list[Evaluation] = evaluate(queries, probes=probes, maxsim_refine=maxsim_refine)
    print("ndcg@10", sum(r.ndcg for r in res) / len(res))
    print("recall@10", sum(r.recall for r in res) / len(res))
    print(f"Total execution time: {total_time:.4f} seconds")
```

Running the evaluation script yields impressive results:

```markdown
# Disable WARP
ndcg@10 0.8615
recall@10 0.92
Total execution time: 810 seconds # Baseline accuracy and time

# Enable WARP
# There is no need to focus on specific times,
# only relative times need to be taken into account,
# as the tests were performed on a local model with poor performance.
ndcg@10 0.8353
recall@10 0.90
Total execution time: 41 seconds # Dramatic WARP Speed Boost
```

**Analysis:**

* **High Baseline Accuracy:** First, let's look at the baseline performance without WARP optimization. The system achieves an excellent NDCG@10 of **0.8615** and Recall@10 of **0.92**. This confirms the fundamental effectiveness of ColQwen2 embeddings paired with VectorChord's precise MaxSim search, delivering state-of-the-art results for visual document retrieval *even without* speed optimizations.

* **Dramatic WARP Speed Boost:** Now, observe the impact of enabling VectorChord's **WARP optimization**. The total execution time plummets from a substantial 810 seconds down to just **41 seconds**! This represents a massive **~18.7x speedup** for the evaluation query set. This clearly demonstrates WARP's power in dramatically accelerating the computationally intensive MaxSim operations required for late-interaction models like ColQwen2.

* **Minimal Accuracy Trade-off:** Impressively, this significant speed gain comes at the cost of only a very minor dip in retrieval accuracy. The NDCG@10 slightly decreases to **0.8353** (a difference of less than 0.3), and Recall@10 reduces minimally to **0.9** (a difference of only 0.02).


## Conclusion: Visual RAG Made Simpler in Postgres

In this tutorial, we successfully built a high-performance, **OCR-free RAG system** by bringing together the visual understanding capabilities of **ColQwen2**, the scalable multi-vector search of **VectorChord** within **PostgreSQL**, and the efficient GPU processing of **Modal**. We saw how this stack allows us to directly query documents based on their visual content, bypassing the pitfalls of traditional OCR pipelines.

The ability to seamlessly integrate this visual dimension into your RAG system directly within Postgres opens up exciting possibilities for applications dealing with visually rich documents like scientific papers, invoices, product manuals, historical archives, and much more.

Ready to try it yourself?

* **Explore the Code:** [https://github.com/xieydd/vectorchord-colqwen2](https://github.com/xieydd/vectorchord-colqwen2)

* **Dive Deeper into VectorChord:** Check out the [**VectorChord documentation**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdocs.vectorchord.ai%2F) or try the hassle-free [**VectorChord Cloud**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fcloud.vectorchord.ai%2F).

* **Experiment:** Try different VLMs or datasets.

* **Share Your Thoughts:** Let us know your experiences or questions in the comments below!


This approach represents a significant step towards simpler, more robust, and visually-aware document retrieval systems.

## References

* [https://huggingface.co/vidore/colqwen2-v1.0](https://huggingface.co/vidore/colqwen2-v1.0)

* [https://huggingface.co/blog/manu/colpali](https://huggingface.co/blog/manu/colpali)

* [https://blog.vespa.ai/scaling-colpali-to-billions/](https://blog.vespa.ai/scaling-colpali-to-billions/)