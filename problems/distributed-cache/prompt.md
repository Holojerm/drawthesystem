# Design a distributed caching layer
_Company: generic · Mode: depth · Time: 45 min · Level: senior/staff_

## Setting
A read-heavy product catalog service is overwhelming its primary database at peak — the same few thousand popular items are re-read constantly, while millions of long-tail items are read rarely. You're asked to put a caching layer in front of it.

## The ask
Design the caching layer: how it's populated, how it stays consistent with the database, and how it behaves when it's cold, oversized, or a node fails.

## Given constraints
- ~1M reads/sec at peak, ~2% of that volume are writes to the underlying data
- Working set of hot items fits in memory across a modest cluster, but the full catalog does not
- Cache must not serve data more than a few seconds stale after a write, and must never serve a different value for the same key to two callers hitting different cache nodes at the same moment
- A cold cache (fresh deploy, node restart) must not cause a "thundering herd" of requests hammering the database for the same popular keys simultaneously
- One cache node failing should degrade gracefully, not take down the read path

## Deliverables
Requirements → estimates (working set size, hit-rate target) → cache topology and eviction policy → consistency/invalidation strategy → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: cache-aside vs. write-through, the thundering-herd defense, and how invalidation propagates across nodes.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
