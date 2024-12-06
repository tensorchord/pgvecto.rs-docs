# Troubleshooting

## Connectivity 

### 1. Cluster is not reachable, you can check the following:

If the status of the cluster, if it is `NotReady`, you can check the metrics of the cluster to see if there are free space for PGData. 

:::warning
Do not delete your cluster, it will cause data loss.
:::
**Solution**: 
- You can upgrade your cluster to a larger size to solve the problem, you can refer to the [upgrade cluster storage](/cloud/manage/upgrade#increasing-only-storage) for more information. After the upgrade is completed, the cluster will be in the `Ready` status, and the cluster will be reachable.

If above solution does not work, you can contact us at [Discord](https://discord.com/channels/974584200327991326/1243043133801889792), we are happy to help.