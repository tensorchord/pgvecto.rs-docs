# Monitoring

The VectorChord Cloud provides several graphs for monitoring system and database metrics. You can access the **Metrics** dashboard from the cluster details in the VectorChord Cloud Console. Observable metrics include:
- [Storage Usage](#storage-usage)
- [RAM](#ram)
- [CPU](#cpu)
- [Index](#vector)

## Storage Usage

This graph shows the total and usage of the storage of Postgres instance.
![](../images/storage-usage.png )

## RAM

This graph shows the average memory usage of the Postgres instance, the unit is in MB. 

![](../images/memory_usage.png)

## CPU

This graph shows the average CPU utilization percentage of the Postgres instance in past 5 minutes.

![](../images/cpu_utilization.png)

## Vector

This graph shows the details of the vector index, including following metrics:
- Index Name: The name of the index.
- Index Dimension: The dimension of the vectors in the index.
- Index Vector Count: The number of vectors in the index.
- Index Options: Details of the index options can be found in the [Index Options](../../vectorchord/usage/indexing#indexing-options)
- Indexing: If `True`, it means the index is in the process of indexing the data. 

![](../images/indexes.png)