# Fallback Parameters <badge type="tip" text="since v1.1.0" />

Search parameters are typically configured via GUCs. VectorChord also offers an alternative method, allowing these parameters to be attached directly to an index instead of a session or transaction. In other words, you can store them as part of the index's storage parameters.

You could set `probes` at index building using the following syntax.

```sql
CREATE INDEX items_embedding_idx ON items USING vchordrq (embedding vector_l2_ops) WITH (options = $$
build.internal.lists = [1000]
$$, probes = '10');
```

You can now perform searches without setting GUCs:

```sql
--- probes = '10'
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

If the index is already built, you can set `probes` like this:

```sql
ALTER INDEX items_embedding_idx SET (probes = '100');
```

You can still set GUCs for search parameters. When you do so, the GUCs take precedence over the index storage parameters. This allows you to temporarily override these settings for the current session or transaction without locking the index.

```sql
SET vchordrq.probes TO '100';
--- probes = '100'
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

This syntax is useful in the following situations:

* When there are multiple indexes.
* When you prefer not to set GUCs.
* When you want to configure search parameters offline.

As long as GUCs are set, even at the system level or database level, they will override the index settings. So, to avoid hard-to-detect issues, we recommend using only one method to set search parameters, either via GUCs or via index storage parameters.

Not all parameters support this feature. See [Reference](#reference) for all supported parameters.

## Reference {#reference}

### Index Storage Parameters <badge type="info" text="vchordrq" />

#### `probes` <badge type="tip" text="since v1.1.0" />

- Description: Fallback value of [`vchordrq.probes`](indexing#search-parameters-vchordrq-probes).
- Type: list of integers
- Default: ` `

#### `epsilon` <badge type="tip" text="since v1.1.0" />

- Description: Fallback value of [`vchordrq.epsilon`](indexing#search-parameters-vchordrq-epsilon).
- Type: real
- Default: `1.9`
- Domain: `[0.0, 4.0]`

#### `maxsim_refine` <badge type="tip" text="since v1.1.0" />

- Description: Fallback value of [`vchordrq.maxsim_refine`](indexing-with-maxsim-operators#search-parameters-vchordrq-maxsim-refine).
- Type: integer
- Default: `0`
- Domain: `[0, 2147483647]`

#### `maxsim_threshold` <badge type="tip" text="since v1.1.0" />

- Description: Fallback value of [`vchordrq.maxsim_threshold`](indexing-with-maxsim-operators#search-parameters-vchordrq-maxsim-threshold).
- Type: integer
- Default: `0`
- Domain: `[0, 2147483647]`

### Index Storage Parameters <badge type="info" text="vchordg" />

#### `ef_search` <badge type="tip" text="since v1.1.0" />

- Description: Fallback value of [`vchordg.ef_search`](graph-index#search-parameters-vchordg-ef-search).
- Type: integer
- Default: `64`
- Domain: `[1, 65535]`
