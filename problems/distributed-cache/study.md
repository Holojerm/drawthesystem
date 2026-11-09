# Study notes: distributed cache

## Key trade-offs
- **Cache-aside or write-through.** Cache-aside fills on a miss and is simple and tolerant of cache loss, but a write followed by a stale read is possible. Write-through keeps the cache current, but writes cost more and a cache of mostly cold items fills with data nobody reads. With 2% writes and a long tail, think hard about whether paying on every write is worth it.
- **Invalidate or update on write.** Deleting the key forces the next reader to repopulate, which is safe and creates a miss. Writing the new value avoids the miss and risks a race where an older value lands after a newer one. Deleting is the safer default; versioned writes make updating safe.
- **TTL as backstop or as the mechanism.** A TTL alone bounds staleness only up to its length, and the constraint here is a few seconds. A short TTL on top of explicit invalidation gives a hard bound if an invalidation is lost. The price is more database load from expiry, so jitter the TTLs.
- **Client-side or proxy routing.** Smart clients that hash keys to nodes avoid a hop and need to agree on cluster membership. A proxy tier centralises that logic and adds latency and a component to scale. The right answer depends on how many client languages and teams you have.
- **Consistent hashing and rebalancing.** Placing keys on a ring moves a small share of keys when a node joins or leaves, but the moved keys start cold and hit the database. Replicating hot keys to more than one node spreads load and creates the question of how copies stay in step.

## Common mistakes
- **Saying "TTL" and stopping.** Time-based expiry alone cannot meet a few-seconds staleness bound after a write, and short TTLs on everything bring the database load back.
- **No defence against many callers missing the same key.** A popular key expiring or a node restarting sends thousands of identical queries to the database at once. Coalescing requests per key is the usual fix.
- **Hashing keys with modulo.** Any change in node count remaps almost every key and empties the cache at the worst possible time.
- **Letting two nodes hold different values for one key without saying how.** If both can serve it, you need a story for who is allowed to cache a key and how an invalidation reaches every holder.
- **Treating a node failure as a cache outage.** If a lost node sends all its traffic to the database, the cache has become a single point of failure. Plan for the degraded case, including load shedding.
