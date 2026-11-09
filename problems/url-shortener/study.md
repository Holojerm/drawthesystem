# Study notes: URL shortener

## Key trade-offs
- **Counter or hash for ids.** A counter (range-allocated, then base62 encoded) never collides but leaks creation order and needs a coordinated allocator. A hash of the long URL is stateless but collides, so you need a check-and-retry on insert and a longer code to keep that rare. Guessable ids matter more if links can be private; at 100M links a month either works if you say how you handle the failure case.
- **Cache-first redirects or fresh reads.** Serving from an edge or regional cache keeps p99 low and protects the database, but every cached copy can outlive a delete, an edit or an abuse takedown. The shorter the TTL, the more the origin is hit. Decide how fast a killed link must stop resolving and pick the mechanism (short TTL, purge, or a small kill list checked on every hit) to match.
- **301 or 302.** A permanent redirect is cacheable by browsers and cuts load, but later clicks never reach you, so analytics undercount and a takedown cannot reach those browsers. A temporary redirect costs a request per click and keeps you in control. Analytics and abuse control usually push toward 302.
- **Sync or async click logging.** Writing the click before responding gives exact counts but puts a write on the latency-critical path. Emitting an event to a queue and aggregating later keeps the redirect fast and allows a small loss. The one-minute freshness target is what makes async clearly right here; the real question is how much loss you accept and how you dedupe.
- **Exact or approximate counts.** Exact per-link counters under a viral spike create a hot row. Sharded counters or periodic roll-ups spread the write load at the cost of a few seconds of lag and slightly fuzzy totals. Billing-grade accuracy and a marketing dashboard want different answers.

## Common mistakes
- **Treating the redirect as a normal database read.** At ten billion redirects a month with a heavy tail, a handful of links dominate traffic. Without caching in front, those few keys overload their shard while most of the cluster idles.
- **Hashing the long URL and ignoring collisions.** Two different URLs can map to the same short code, and the same URL submitted by two customers should usually get two separate links. Without a defined collision path you serve someone else's destination.
- **Writing each click synchronously to the primary store.** It adds latency to the path that must stay under 50 ms and turns a viral link into a write storm on one row.
- **Skipping custom-alias uniqueness.** Checking whether an alias exists and then inserting it is a race. Two requests can both pass the check, so you need a unique constraint or a conditional write as the source of truth.
- **No plan for expiry, deletion and abuse.** Links live for years, so stale and malicious links accumulate. If takedown is not designed into the cache layer, the claim that bad links die in seconds is unsupported.
