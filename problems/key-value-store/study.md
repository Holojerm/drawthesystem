# Study notes: key-value store

## Key trade-offs
- **Consistency level and latency.** Waiting for a majority of replicas on every read and write gives strong guarantees and pays the slowest replica in the quorum on each request. Reading or writing one replica is fast and can return stale data. Offering the choice per request lets callers pick, and makes you explain what each setting guarantees.
- **Replica count.** Three copies survive one failure and a rebalance at a time with reasonable cost. Five tolerate more and cost more storage and write traffic. The number should follow how long a failed node stays down and how often a second failure overlaps.
- **Conflict resolution.** Last-write-wins with timestamps is simple and silently drops one of two concurrent writes when clocks differ. Version vectors detect the conflict and push resolution to the application or a merge rule. Single-leader-per-key avoids conflicts and makes failover your problem.
- **Virtual nodes.** Giving each machine many ring positions smooths load and makes moves small, and also makes membership state larger and rebuilds touch many peers at once. Fewer tokens are simpler and balance worse.
- **Failure detection and repair.** Aggressive detection restores redundancy quickly and misfires on a slow network, causing needless data movement. Slow detection leaves less redundancy for longer. Repair can be on read, in the background, or by buffering writes for a down node, and each has a different cost and window of exposure.

## Common mistakes
- **Partitioning with a hash modulo the node count.** Adding or removing one node reassigns nearly all keys, which is exactly what the resize requirement rules out.
- **Saying "replicate it" without naming a read and write rule.** Without a quorum or leader rule, you cannot say what a reader sees after a write or after a failure.
- **Trusting clocks for ordering writes.** Skew of tens of milliseconds is routine, so a later write can lose to an earlier one without anyone noticing.
- **Ignoring hot keys.** Hashing spreads keys evenly, not traffic. One popular key can saturate its replicas while the rest of the cluster is idle.
- **Skipping the failure path.** If you cannot say what happens to writes during a node outage and how the replacement catches up, durability is an assertion, not a design.
