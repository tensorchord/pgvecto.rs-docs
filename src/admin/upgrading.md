# Upgrading

If you update the extension to a new version, let's say it's `999.999.999`. This command helps you to update the schema of extension:

```sql
ALTER EXTENSION vectors UPDATE TO '999.999.999';
```

Then check the status of all vector indexes:

```sql
SELECT * FROM pg_vector_index_stat;
```

If you see the error `The extension is upgraded so all index files are outdated.`, you need to delete the index files created by older versions. You can delete the folder with this command:

```shell
rm -rf $(psql -U postgres -tAqX -c $'SELECT CONCAT(CURRENT_SETTING(\'data_directory\'), \'/pg_vectors\');')
```

If you are using Docker, you can just delete `pg_vectors` folder under the volume directory too. Then you need to restart PostgreSQL.

If you see the error `The extension is upgraded so this index is outdated.` when using an index or see the text `UPGRADE` in the view `pg_vector_index_stat`, you need to reindex these indexes.

Let's say the name of the index is `t_val_idx`, you will reindex them with this SQL:

```sql
REINDEX INDEX t_val_idx;
```
