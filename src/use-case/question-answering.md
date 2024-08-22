# Generative Question-Answering
Vector search can also be used to provide context to generative models such as OpenAI's GPT series, improving the quality of the outputs. 

This post will explore the use of `pgvecto.rs` in building and retrieving from a vector knowledge base to bolster the performance of generative models in question-answering tasks. A knowledge base serves as "long-term memory" for generative models, providing them persistent, curated, and accurate information as **context** to draw from when generating an answer to a question. This results in answers that are more accurate, reduces the possibility of the model producing "hallucinations" (statements with no basis in reality), and increases user trust in the outputs. This technique is known as Retrieval-Augmented Generation, or RAG: see [this post](https://ai.meta.com/blog/retrieval-augmented-generation-streamlining-the-creation-of-intelligent-natural-language-processing-models/) or the [related paper](https://arxiv.org/abs/2005.11401v4) for more information. 

## Overview of the Question-Answering task
The generative model question-answering (QA) task is a method of **Information Retrieval**. The model is presented with a question, and generates an answer based on some context: typically, documents or other information sources the model can look at to retrieve the information necessary to answer the question. 

This use case will involve giving the OpenAI `gpt-3.5-turbo-instruct` model context to answer questions about movies from the [vishnupriyavr/wiki-movie-plots-with-summaries-faiss-embeddings](https://huggingface.co/datasets/vishnupriyavr/wiki-movie-plots-with-summaries-faiss-embeddings) Huggingface dataset. 

The overall workflow will look something like this: 
![](./question-answering/diagram_v3.png)

## Question-Answering without Context
First, let's try having the model answer some questions without providing it context. 

We begin with defining a function to streamline getting a response for a given prompt:
```python
# pip install openai

import openai

openai.api_key = "YOUR_API_KEY_HERE"
def complete(prompt):
    result = openai.Completion.create(
        engine='gpt-3.5-turbo-instruct',
        prompt=prompt,
        temperature=0,
        max_tokens=400,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None
    )
    return result['choices'][0]['text'].strip()

```
:::info
The `api_key` requires an OpenAI account. Once logged in, sign up for an API key from the top-right drop-down menu, and paste it in place of `YOUR_API_KEY_HERE`. 
:::

Let's start with asking about a relatively popular movie: 
```python
base_prompt = "What is the release year and overall plot of Skyfall?"
print(complete(base_prompt))
```
:::tip Output:
The release year of Skyfall is 2012. The overall plot follows James Bond as he investigates an attack on MI6 and uncovers a sinister plot by a former agent seeking revenge on M and the entire agency. Bond must confront his past and protect MI6 from destruction.
:::

Accurate, if somewhat vague in the plot summary. However, what about a movie that's much less known?
```python
base_prompt_2 = "What is the release year and overall plot of Cat Napping?"
print(complete(base_prompt_2))
```
:::tip Output: 
The release year of Cat Napping is unknown. The overall plot of Cat Napping is about a group of cats who go on a mission to rescue their friend who has been kidnapped by a group of evil dogs. Along the way, they encounter various challenges and obstacles, but with their cleverness and teamwork, they are able to save their friend and defeat the dogs.
:::
:::details Correct answer:
Cat Napping is actually a Tom and Jerry movie from 1951, where the two fight over a hammock. 
:::
We have found the limits of what the model "knows": it is unable to produce the release year, and invents a potential plot based on the title. We will remedy this by creating a knowledge base for the model to draw on. 

There are two options for allowing the model to better answer our question: 
1. Fine-tune the model on text data in the domain of interest (movies in this case). 
2. Employ __retrieval augmented generation__, which adds an information retrieval component to the process. This will allow us to retrieve and feed relevant information to the model as a secondary source of information. 

We will be taking the second option in this post.  

## Building the Knowledge Base
Let's build a knowledge base of movies to retrieve relevant information from, using the [vishnupriyavr/wiki-movie-plots-with-summaries-faiss-embeddings](https://huggingface.co/datasets/vishnupriyavr/wiki-movie-plots-with-summaries-faiss-embeddings) Huggingface dataset. This dataset contains titles, release years, casts, Wikipedia pages, plot summaries/lengths, and vector embeddings of this information for 33,155 movies. Each movie also has `text` data, which encompasses title, release year, cast, and plot summary in one. We will be using the `text` and `embeddings` data for this application. 

### Load the Data

Start by loading the data: 
```python
# pip install -U datasets
from datasets import load_dataset
dataset = load_dataset("vishnupriyavr/wiki-movie-plots-with-summaries-faiss-embeddings", split='train')

texts = dataset['train']['text']
# texts[0]
# 'Alice in Wonderland \n  starring May Clark \n  released in the year1903 \n  with the following plot  \n Alice follows a large white rabbit down a "Rabbit-hole". She finds a tiny door. When she finds a bottle labeled "Drink me", she does, and shrinks, but not enough to pass through the door. She then eats something labeled "Eat me" and grows larger. She finds a fan when enables her to shrink enough to get into the "Garden" and try to get a "Dog" to play with her. She enters the "White Rabbit\'s tiny House," but suddenly resumes her normal size. In order to get out, she has to use the "magic fan."\r\nShe enters a kitchen, in which there is a cook and a woman holding a baby. She persuades the woman to give her the child and takes the infant outside after the cook starts throwing things around. The baby then turns into a pig and squirms out of her grip. "The Duchess\'s Cheshire Cat" appears and disappears a couple of times to Alice and directs her to the Mad Hatter\'s "Mad Tea-Party." After a while, she leaves.\r\nThe Queen invites Alice to join the "ROYAL PROCESSION": a parade of marching playing cards and others headed by the White Rabbit. When Alice "unintentionally offends the Queen", the latter summons the "Executioner". Alice "boxes the ears", then flees when all the playing cards come for her. Then she wakes up and realizes it was all a dream.'
```

### Generate Embeddings

This particular dataset comes with embeddings, so you can skip this step and use the embeddings directly.  

```python
embeddings = dataset['train']['embeddings']
```

If you want to generate embeddings from the text data, you can use the OpenAI, Cohere or other embeddings APIs. We provide an example using the Cohere API, you can get Cohere API key from [here](https://dashboard.cohere.com/api-keys). 
```python
# pip install cohere
import getpass
import os
import cohere

if not os.getenv("COHERE_API_KEY"):
    os.environ["COHERE_API_KEY"] = getpass.getpass("Enter your Cohere API key: ")

co = cohere.Client()
# embedding model can refer to this documentation: https://docs.cohere.com/docs/cohere-embed
embed = co.embed(
    texts=texts,
    input_type="search_query",
    model="embed-english-v3.0"
)
embeddings = embed.embeddings
```

:::info
The embeddings in this user case are dense vectors. For creating sparse vectors, you can see [this page](/use-case/sparse-vector.html#how-to-create-a-vector-embedding).
:::

A deployed `pgvecto.rs` instance is required for vector storage and retrieval. We can use the official `pgvecto-rs` Docker image:

```bash
docker run \
  --name pgvecto-rs-demo \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d tensorchord/pgvecto-rs:pg16-v0.3.0
```
Install the required `psycopg` library to interact with Postgres, and ensure the extension is running: 
```python
#pip install "psycopg[binary,pool]"
import psycopg

URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
#Create the table
with psycopg.connect(URL) as conn:
    conn.execute("DROP EXTENSION IF EXISTS vectors;")
    conn.execute("CREATE EXTENSION vectors;")
```

Now, we create a table `movies` with a few columns: an ID column(`id`), a text column(`texts`), and a vector column(`embeddings`). 
```python
import psycopg
URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"

#Create the table
with psycopg.connect(URL) as conn:
    conn.execute("DROP TABLE IF EXISTS movies;")
    conn.execute(f"""
        CREATE TABLE movies (
            id SERIAL PRIMARY KEY, 
            text TEXT NOT NULL,
            embedding vector(768) NOT NULL);
    """
    )
```
:::info
We use type `vector(n)`, as we are working with dense vector embeddings, where `n` is the dimension of each embedding (768 in this case). 
:::

With the table created, we can now insert the embeddings from the dataset and create indexes for vector columns:
```python
# Optional install, but recommended:
# pip install tqdm
import psycopg
from tqdm import tqdm
URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"

#Insert into table
with psycopg.connect(URL) as conn:
    with conn.cursor() as cursor:    
        for text, embedding in tqdm(zip(texts, embeddings), total=len(texts)):
            cursor.execute(
                """INSERT INTO movies (text, embedding) 
                    VALUES (%s, %s::real[]);""",
                (text, embedding),
            )
        conn.commit()
```
:::warning
This may take a while, depending on how much data is to be inserted. 
:::
```python
import psycopg
URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"

#Creating indexes for embedding column
with psycopg.connect(URL) as conn:
    cursor = conn.cursor()
    cursor.execute("""
        CREATE INDEX ON movies 
        USING vectors (embedding vector_l2_ops) 
        WITH (options = \"[indexing.hnsw]\");
    """)
    conn.commit()
```
:::info
Recall that for dense vectors, `vector_l2_ops` calculates the Squared Euclidean distance, which is the most commonly used distance metric. 
$$
D_{L2} = \Sigma (x_i - y_i) ^ 2
$$
:::


## Question-Answering with Context
To make use of our knowledge base, queries must first be encoded to determine what texts to retrieve:
```python
# pip install sentence-transformers

from sentence_transformers import SentenceTransformer

#some options: 'paraphrase-mpnet-base-v2', 'all-mpnet-base-v2'
encoder = SentenceTransformer('all-mpnet-base-v2')

def encode_query(query): #Query is a string
    #Preprocess the query
    query = query.lower()
    query = query.split()
    query = [word for word in query]
    query = ' '.join(query)
    
    #then encode the query
    vector = encoder.encode(query)
    return vector
```

Now, we define a function to streamline adding the retrieved context to the initial prompt:
```python
import psycopg
URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"

def add_context(prompt):
    search_vector = encode_query(prompt).tolist()
    # Construct prompt with the retrieved contexts included
    prompt_start = (
        "Answer the question based on the following context:\n\n"
    )
    prompt_end = (
        f"\n\nQuestion: {prompt}\nAnswer:"
    )
    with psycopg.connect(URL) as conn:
        cursor = conn.cursor()
        #Tune limit in accordance with how movie texts you want to give to the model
        cursor.execute("SELECT text FROM movies ORDER BY embedding <-> %s::real[] LIMIT 3;", 
                  (search_vector,),)
        result = cursor.fetchall()
    context = ""
    for r in result:
        context += r[0] + "\n\n"
    return prompt_start + context + prompt_end
```
:::info
Recall the options for distance operators:

 - `<->` for squared Euclidean distance
 - `<#>` for negative dot product
 - `<=>` for cosine distance

For definitions, please see the [overview](/getting-started/overview.html#quick-start). 
 :::

 Now, let's try the prompt again, with added context: 
 ```python
base_prompt_2 = "What is the release year and overall plot of Cat Napping?"

context_prompt_2 = add_context(base_prompt_2)
context_response_2 = complete(context_prompt_2)
print(context_response_2)
```
:::tip Output:
The release year of Cat Napping is 1951 and the overall plot involves Tom and Jerry fighting over a hammock, with Jerry ultimately getting revenge on Tom.
:::
Now the model has given us a more accurate answer! We can even ask further questions:
```python
base_prompt_3 = "In Cat Napping, what does Tom do to Jerry?"
print(complete(add_context(base_prompt_3)))
```
:::tip Output:
Tom tries to send Jerry sliding into a nearby pond by unhooking the hammock he is sleeping in. He also tries to whack the hammock to send Jerry flying into the air, but Jerry lands in a bird's nest. Tom then picks Jerry up on a spatula and places him onto a walking army of ants, causing Jerry to wake up as he bumps his head on a sprinkler. Tom also tries to chase Jerry with a lawn mower and a baseball bat.
:::

As we saw earlier in this post, LLMs do work very well by themselves, but can struggle with niche or specific questions, creating "hallucinations" that may not be noticed. The use of the knowledge base improves factuality and subsequently user trust in the generated outputs. 

## Further Applications
This method is not only for asking about movies, of course. Other applications could include extracting summaries of scientific papers (try [this](https://huggingface.co/datasets/MongoDB/subset_arxiv_papers_with_embeddings) dataset!), or answering questions about company policies provided a database of company literature. 