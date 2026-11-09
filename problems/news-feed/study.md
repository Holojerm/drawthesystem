# Study notes: news feed

## Key trade-offs
- **Fan-out on write or on read.** Precomputing each follower's feed makes reads cheap and fast and makes every post cost as many writes as the author has followers. Merging at read time makes posts cheap and reads slow and expensive. Follower count and read-to-write ratio decide it, and the problem has accounts at both extremes.
- **What the feed stores.** Keeping post ids per user is small and lets edits and deletes apply once, at the cost of a hydration step on every read. Copying post content into each feed makes reads one lookup and makes deletion, edits and storage painful.
- **Ranked or chronological.** A time-ordered list is a cheap append-only structure. Ranking needs features, a scoring step and often a candidate set larger than the page, which changes both storage and the latency budget. Say how much ranking you do on the read path and what you precompute.
- **Freshness against cost.** Pushing every post to every active follower immediately is the most current and the most expensive. Skipping feed updates for inactive users and rebuilding on their next visit saves large amounts of work. Define "active" by something you can measure.
- **Caching the feed.** A cached first page makes cold-open latency easy and goes stale or wrong when follows, blocks or deletes change. Decide what invalidates it and what staleness users will tolerate.

## Common mistakes
- **One strategy for every account.** Writing a post to 50 million feeds blocks queues and delays everyone else's posts, and merging 300 follows at read time for every normal user wastes the read path.
- **Duplicating full posts into each feed.** Storage multiplies by follower count, and a deletion or edit has to chase every copy.
- **Ignoring unfollows, blocks and deletions.** A precomputed feed will keep showing content that should be gone unless you filter at read time or clean up.
- **Forgetting the new or returning user.** A user with an empty or expired precomputed feed still needs a fast, sensible first screen.
- **Hot spots in the graph store.** A celebrity's follower list and their post are read by millions at once. Without caching or replication, those few keys overload a shard.
