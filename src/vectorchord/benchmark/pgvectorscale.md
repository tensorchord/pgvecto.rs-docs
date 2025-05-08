# Benchmark with pgvectorscale

In this section, we compare VectorChord with pgvectorscale, a PostgreSQL extension that provides vector similarity search capabilities. We will focus on four key metrics: QPS (Queries Per Second), Recall@10/100, Index Building Time, and Insertion Time. Memory and disk performance will also be discussed. If you are interested in the details of our implementation, please refer to our blog [Vector Search Over PostgreSQL: A Comparative Analysis of Memory and Disk Solutions](https://blog.vectorchord.ai/vector-search-over-postgresql-a-comparative-analysis-of-memory-and-disk-solutions).

## QPS & Recall

### Memory

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1743412050649/4def8f06-694a-4021-a306-a54da58ea6ab.png?auto=compress,format&format=webp" alt="QPS on LAION 5m memory" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

The graphs illustrate the trade-off between query speed (QPS) and search quality (Recall@10/100). Recall@10 measures the percentage of true nearest neighbors found within the top 10 results. In general, higher QPS can be achieved at the cost of lower recall, and vice versa. A better system may achieve higher recall at the same QPS, or higher QPS at the same recall level. Our goal is typically to maximize QPS while maintaining a high recall target (e.g., 95%).

### Disk

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1743350651982/ae12fa1b-ae4a-435c-aa00-def89921992b.png" alt="QPS on LAION 5m disk" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

As always, VectorChord consistently achieves higher QPS at high recall levels (e.g., >95% Recall@10) compared to the other extensions, followed by pgvector and pgvectorscale with similar QPS.

## Index Building

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1743503547507/9847a9c4-fcaa-4d76-bf82-3f5c5e959ef4.png?auto=compress,format&format=webp" alt="All About Index Building" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

VectorChord maximizes CPU usage, reduces memory consumption, and shortens index-building time compared to pgvectorsale.

## Insertion Time

<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1743497738743/68305934-b301-4f53-85ae-d614eb070577.png?auto=compress,format&format=webp" alt="Insertion Time" style="width: 100%; height: auto; margin: 0 auto; display: block;" />

As you can see, VectorChord **(1565 Insert/Sec)** performs much better than pgvector **(246 Insert/Sec)** and pgvectorscale **(107 Insert/Sec)** when inserting data. For most workloads, 100 Insert/Sec is more than enough. However, if you find that a lot of vectors are continuously inserted in your production (for example, 500 Insert/Sec), this could be a problem.