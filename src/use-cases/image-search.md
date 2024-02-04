# Image Search

Image intelligent search, also known as content-based image retrieval, goes beyond traditional keyword-based search and enables users to search for images based on their **visual content**. For example, you could search images that **contain** a red mushroom (image from [immich](https://immich.app)):

![image-search](https://immich.app/assets/images/search-ex-2-707fe5ab1ab89621a7a1f3e8807b724a.webp)

The feature looks like a magic because it allows you to search for images that you don't have keywords for. The search engine understands the content of the images and videos and can find the ones that are similar to the query.

## How it works

Image intelligent search leverages advanced computer vision techniques and machine learning algorithms to understand the visual characteristics and features within images, allowing users to perform freeform searches without relying on specific keywords or metadata.

The first step is to extract meaningful features from images and generate a vector representation of each image. This is typically done using deep learning models such as [CLIP](https://openai.com/research/clip). The vector representation is called an **embedding**. It is a list of numbers that represents the image.

Then you could use vector stores like [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) to store the embeddings and perform efficient vector search.

## Example

We will use [CLIP](https://openai.com/research/clip) to generate embeddings for images. Then we will use [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) to store the embeddings and perform efficient vector search.

### Generate embeddings

You could use [CLIP](https://openai.com/research/clip) to generate embeddings for images:

```python
from transformers import CLIPProcessor, CLIPModel

processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")

def compute_image_embeddings(list_of_images):
    return model.get_image_features(**processor(images=list_of_images, return_tensors="pt", padding=True))
```

### Store embeddings

Let's say you have a table named `images` with three columns: `id`, `author` and `embedding`. The column `embedding` is of type `vector(512)`. You could insert an image into the table like this:

```sql
-- Create the table
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    author TEXT NOT NULL,
    vector vector(512) NOT NULL -- 3 dimensions
);

INSERT INTO images (author, embedding) VALUES
  ('Allen', '[...]');
```

### Search for similar images

You could search for similar images like this:

```sql
SELECT * FROM images ORDER BY embedding <-> '[...]' LIMIT 5;
```

## Advanced search

Assuming you want to search for the 64 nearest rows and the results don't contain the images from the author `Allen`.

You may want the following SQL to work:

```sql
SET vectors.hnsw_ef_search = 64;
SELECT * FROM images ORDER BY embedding <-> '[...]' WHERE author != 'Allen' LIMIT 64;
```

In `base` mode, you may only get `32` rows since the HNSW algorithm bypasses filter conditions during the search and relies on PostgreSQL to apply filters post-search.

You could use the `vbase` search mode to achieve this. In `vbase` mode, **searching results become a stream** and every time the database pulls a row, the vector index computes a row to return. It's quite different from an ordinary vector search if you are using a vector search library, such as *faiss*. The latter always wants to know how many results are needed before searching. The original idea comes from [VBASE: Unifying Online Vector Similarity Search and Relational Queries via Relaxed Monotonicity](https://www.usenix.org/conference/osdi23/presentation/zhang-qianxi).

You can enable `vbase` by a SQL statement `SET vectors.search_mode = vbase;`. Then you can get the correct behavior. This mode is used in [immich](https://immich.app)'s image search feature.
