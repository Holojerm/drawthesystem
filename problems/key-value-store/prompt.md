# Design a distributed key-value store
_Company: generic · Mode: depth · Time: 45 min · Level: senior/staff_

## Setting
Several internal teams need a shared, horizontally-scalable key-value store for session data and small cached objects — simple GET/PUT/DELETE by key, no query language, but it has to survive node failures without losing data or serving stale writes to the wrong client.

## The ask
Design the storage layer: how keys are partitioned across nodes, how data is replicated, and how the system behaves when a node fails or the cluster is resized.

## Given constraints
- ~10K nodes at target scale, values up to 1 MB, ~1M ops/sec cluster-wide
- Tunable consistency: callers can ask for strong reads on some keys and accept eventual consistency on others
- A single node failure must not cause data loss or a client-visible outage; the cluster must keep serving during a rebalance
- Adding or removing nodes should move a bounded, small fraction of keys, not reshuffle the whole keyspace
- p99 GET latency < 10 ms

## Deliverables
Requirements → partitioning scheme (and why) → replication/consistency model → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: consistent hashing and rebalancing cost, how you detect and handle a failed node, and what "tunable consistency" actually changes on the read/write path.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
