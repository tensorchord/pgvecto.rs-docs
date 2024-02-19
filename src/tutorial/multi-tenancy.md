# Multi Tenancy

Multi-tenancy is essential for SaaS applications, allowing a single instance to serve multiple users or groups while ensuring data privacy and security. In vector search systems, adopting a user-based isolation model enhances data management and search capabilities by ensuring strict data isolation at the user level. This approach uses a user_id for demarcating access boundaries, ensuring users can only access their data. This blog outlines the design and implementation of such a model, highlighting database schema adjustments, operation modifications, and best practices for maintaining a secure, scalable multi-tenant environment.

## Designing the Database Schema
The success of user-based isolation in multi-tenant systems hinges on a well-structured database schema:

### Users and Documents
Every user is uniquely identified by a user_id, linking them directly to their documents and ensuring private access.
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT
    -- Additional metadata
);
```
### Chunks
Embeddings store vectorized representations of chunks of documents, tied to users through the user_id to maintain isolation.
```sql
CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    embedding vector(512) NOT NULL
);
```

![]("./tutorial/multi-tenancy/er.svg")