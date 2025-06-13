# Image Search

Image intelligent search, also known as content-based image retrieval, goes beyond traditional keyword-based search and enables users to search for images based on their **visual content**. For example, you could search images that **contain** a red mushroom (image from [immich](https://immich.app)):

![image-search](https://immich.app/img/screenshot-light.webp)

The feature looks like a magic because it allows you to search for images that you don't have keywords for. The search engine understands the content of the images and videos and can find the ones that are similar to the query.

## How it works

Image intelligent search leverages advanced computer vision techniques and machine learning algorithms to understand the visual characteristics and features within images, allowing users to perform freeform searches without relying on specific keywords or metadata.

The first step is to extract meaningful features from images and generate a vector representation of each image. This is typically done using deep learning models such as [CLIP](https://openai.com/research/clip). The vector representation is called an **embedding**. It is a list of numbers that represents the image.

Then you could use vector stores like [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) to store the embeddings and perform efficient vector search.

## Example

We will leverage [CLIP](https://openai.com/research/clip), a neural network that connects text and images, to generate embeddings for our images. These embeddings capture the visual concepts present in the images. Subsequently, we will utilize [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs), a scalable vector search tool built on Postgres, to store these embeddings and conduct efficient vector searches. By combining the power of CLIP and pgvecto.rs, we can retrieve similar images based on their visual content.

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

You could use the `vbase` search mode to achieve this. In `vbase` mode, **searching results become an iterator** that continuously returns results. The database can continuously retrieve results from it until the user's query conditions are met. It's quite different from other vector search library, such as *faiss*. The latter can only return a fixed-size result set, and this size needs to be determined before the search. For queries with filtering conditions, it is not possible to determine the size of the result set in advance. As a result, either insufficient results can be obtained or excessive searching will affect latency. The original idea comes from [VBASE: Unifying Online Vector Similarity Search and Relational Queries via Relaxed Monotonicity](https://www.usenix.org/conference/osdi23/presentation/zhang-qianxi).

You can enable `vbase` by a SQL statement `SET vectors.search_mode = vbase;`. Then you can get the correct behavior. This mode is used in [immich](https://immich.app)'s image search feature. vbase is the default search mode in 0.2.

## Real-world applications

Image intelligent search is used in [immich](https://immich.app) to enable users to search for images based on their visual content. The code snippets provided here are inspired by the implementation of the [image search feature](https://github.com/immich-app/immich/blob/bd87eb309c6d7af05db98e5cb08067ee592fc331/server/src/infra/repositories/smart-info.repository.ts#L46-L77) in [immich](https://immich.app).

```sql
SELECT a.*, s.*, e.*
FROM asset_entity AS a
INNER JOIN smart_search AS s ON s.assetId = a.id
LEFT JOIN exif_info AS e ON e.assetId = a.id
WHERE a.ownerId IN (:...userIds)
  AND a.isArchived = false
  AND a.isVisible = true
  AND a.fileCreatedAt < NOW()
ORDER BY s.embedding <=> :embedding
LIMIT :numResults;
```

The query retrieves data from the `asset_entity`, `smart_search`, and `exif_info` tables based on specified conditions and ordering. Let's break down the query:

```sql
SELECT a.*, s.*, e.*
```
This part of the query specifies the columns to be selected from the tables `asset_entity`, `smart_search`, and `exif_info`. The aliases `a`, `s`, and `e` are used to refer to each table respectively.

```sql
FROM asset_entity AS a
INNER JOIN smart_search AS s ON s.assetId = a.id
LEFT JOIN exif_info AS e ON e.assetId = a.id
```
Here, the `asset_entity` table is aliased as `a`, the `smart_search` table as `s`, and the `exif_info` table as `e`. The `INNER JOIN` is used to combine `asset_entity` and `smart_search` based on the condition `s.assetId = a.id`. The `LEFT JOIN` is used to include matching records from the `exif_info` table based on the condition `e.assetId = a.id`.

::: details

The table `asset_entity` has the following schema. 

```sql
CREATE TABLE asset_entity (
  id UUID PRIMARY KEY,
  deviceAssetId VARCHAR NOT NULL,
  ownerId VARCHAR NOT NULL,
  libraryId VARCHAR NOT NULL,
  deviceId VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  originalPath VARCHAR NOT NULL,
  resizePath VARCHAR,
  webpPath VARCHAR DEFAULT '',
  thumbhash BYTEA,
  encodedVideoPath VARCHAR,
  createdAt TIMESTAMPTZ NOT NULL,
  updatedAt TIMESTAMPTZ NOT NULL,
  deletedAt TIMESTAMPTZ,
  fileCreatedAt TIMESTAMPTZ NOT NULL,
  localDateTime TIMESTAMPTZ NOT NULL,
  fileModifiedAt TIMESTAMPTZ NOT NULL,
  isFavorite BOOLEAN DEFAULT false,
  isArchived BOOLEAN DEFAULT false,
  isExternal BOOLEAN DEFAULT false,
  isReadOnly BOOLEAN DEFAULT false,
  isOffline BOOLEAN DEFAULT false,
  checksum BYTEA NOT NULL,
  duration VARCHAR,
  isVisible BOOLEAN DEFAULT true,
  livePhotoVideoId UUID,
  originalFileName VARCHAR NOT NULL,
  sidecarPath VARCHAR,
  stackId UUID,
  CONSTRAINT fk_asset_owner FOREIGN KEY (ownerId) REFERENCES user_entity (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_asset_library FOREIGN KEY (libraryId) REFERENCES library_entity (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_asset_live_photo_video FOREIGN KEY (livePhotoVideoId) REFERENCES asset_entity (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_asset_stack FOREIGN KEY (stackId) REFERENCES asset_stack_entity (id) ON DELETE SET NULL ON UPDATE CASCADE
);
```

:::

```sql
WHERE a.ownerId IN (:...userIds)
  AND a.isArchived = false
  AND a.isVisible = true
  AND a.fileCreatedAt < NOW()
```
In this part, the query applies filters to the `asset_entity` table. It selects rows where the `ownerId` column is among the specified `userIds`, `isArchived` is `false`, `isVisible` is `true`, and `fileCreatedAt` is earlier than the current time (`NOW()`).

```sql
ORDER BY s.embedding <=> :embedding
```
The query orders the results based on the `embedding` column of the `smart_search` table, comparing it to the provided `:embedding` value. The `<=>` operator is used for the comparison.

```sql
LIMIT :numResults;
```
Finally, limit the number of rows returned by the query to the value specified by the `:numResults` parameter.

This is an real-world use case to show how image intelligent search is implemented in a production system.
