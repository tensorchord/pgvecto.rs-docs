# Search

Get the nearest 5 neighbors to a vector

```sql
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

## Operators

These operators are used for distance metrics:

| Name  | Description                |
| ----  | -------------------------- |
| <->   | squared Euclidean distance |
| <#>   | negative dot product       |
| <=>   | cosine distance            |

## Filter

For a given category, get the nearest 10 neighbors to a vector
```sql
SELECT 1 FROM items WHERE category_id = 1 ORDER BY embedding <#> '[0.5,0.5,0.5]' limit 10
```

## Query options

#### `vchordrq.probes`
    
- Description: This GUC parameter `vchordrq.probes` controls how the vector space assists in query pruning. The more probes, the more accurate the search, but also the slower it is.
- Type: Integer
- Default: ``
- Example:
    - `SET vchordrq.probes = 1` means that only one probe is used.
    - `SET vchordrq.probes = 10` means that ten probes are used.
- Note: The default value is `1`, which means that only one probe is used. This is the fastest search, but also the least accurate. If you want to improve the accuracy of the search, you can increase the number of probes. However, this will also slow down the search.

#### `vchordrq.epsilon`
    
- Description: Even after pruning, the number of retrieved vectors remains substantial. The index employs the RaBitQ algorithm to convert vectors into bit vectors, which require just $\frac{1}{32}$ the memory of single-precision floating-point vectors. With minimal floating-point operations, most computations are integer-based, leading to faster processing. Unlike typical quantization algorithms, RaBitQ not only estimates distances but also their lower bounds. The index computes the lower bound for each vector and dynamically adjusts the number of vectors needing recalculated distances, based on the query count, thus balancing performance and accuracy. The GUC parameter `vchordrq.epsilon` controls the conservativeness of the lower bounds of distances. The higher the value, the higher the accuracy, but the worse the performance. The default value provides unnecessarily high accuracy for most indexes, so you can try lowering this parameter to achieve better performance.
- Type: Float
- Default: `1.9`
- Example:
    - `SET vchordrq.epsilon = 0.1` indicates that high accuracy is not required.  
    - `SET vchordrq.epsilon = 4.0` means you need a very high accuracy.
- Note: The default value is `1.9`. The acceptable range is from `0.0` to `4.0`.

You can refer to [performance tuning](../usage/performance-tuning#query-performance) for more information about tuning the query performance.

#### `vchordrq.prewarm_dim`
    
- Description: The `vchordrq.prewarm_dim` GUC parameter is used to prewarm the projection matrix for the specified dimensions. This can help to reduce the latency of the first query after the database is restarted. The default value is `64,128,256,384,512,768,1024,1536`, which means that the projection matrix will be prewarmed for these dimensions when PostgreSQL starts.
- Type: List of integers
- Default: `64,128,256,384,512,768,1024,1536`
- Example:
    - `ALTER SYSTEM SET vchordrq.prewarm_dim = '64,128'` means that the projection matrix will be prewarmed for dimensions 64 and 128.
- Note: This setting requires a database restart to take effect.

#### `vchordrq.io_rerank`
    
- Description: This GUC parameter controls the I/O prefetching strategy for vector search, which can significantly impact search performance on disk-based vectors.
- Type: String
- Default: Depends on PostgreSQL version
    - PostgreSQL 13, 14, 15, 16: `prefetch_buffer`
    - PostgreSQL 17: `read_stream`
- Possible values:
    - `read_buffer`: Indicates a preference for ReadBuffer.
    - `prefetch_buffer`: Indicates a preference for both PrefetchBuffer and ReadBuffer. This option is optimized for disk vector search and is the default on PostgreSQL 13, 14, 15, 16.
    - `read_stream`: Indicates a preference for `read_stream`. This option is optimized for disk vector search and is only available in PostgreSQL 17. It's the default on PostgreSQL 17.
- Example:
    - `SET vchordrq.io_rerank = 'prefetch_buffer'` to optimize for disk-based vector search on PostgreSQL versions before 17.
    - `SET vchordrq.io_rerank = 'read_stream'` to use the optimized strategy available on PostgreSQL 17.
