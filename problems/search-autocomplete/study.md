# Study notes: search autocomplete

## Key trade-offs
- **Trie in memory or an index.** An in-memory trie with top results stored per node gives lookups proportional to the prefix length, and uses memory and needs a rebuild process. A search index or sorted store is easier to operate and slower per request. Memory cost depends on how many distinct queries you keep.
- **How many queries to keep.** Keeping every query ever typed includes typos and one-off strings that will never be suggested. Pruning by minimum count or recency shrinks the structure a lot and drops legitimate rare queries.
- **Freshness against stability.** Updating counts continuously surfaces trends within minutes and makes suggestions jump around and costs writes. Rebuilding on a schedule is stable and slow to react. A common split is a large, stable base plus a small, fast-moving layer of recent trends merged at query time.
- **Where to cache.** Caching responses at the edge or in the browser removes most requests, since popular prefixes repeat constantly. Short prefixes are the best candidates. Caching longer, rarer prefixes costs more than it saves.
- **Client behaviour.** Sending a request on every keystroke is the most responsive and multiplies load. Debouncing and cancelling stale requests reduce it with little visible delay. Client-side matching on short prefixes can answer without a request.

## Common mistakes
- **Computing matches at request time.** Scanning or sorting every query that starts with a prefix will not hold at keystroke volume. Precompute the best results per prefix.
- **Updating the serving structure from the write path.** Logging each search into the live trie couples your read latency to write volume. Aggregate separately and publish updates.
- **Ignoring unsafe or unwanted suggestions.** Popular does not mean appropriate. You need a filter list that applies before results are served, and a way to add to it quickly.
- **Treating all prefixes alike.** One-character prefixes are enormous in volume and low in value, and can be fully precomputed and cached. Long prefixes are rare.
- **Failing loudly.** A broken suggestion service should result in no dropdown, not a frozen or erroring search box.
