# Design search autocomplete (type-ahead suggestions)
_Company: generic · Mode: depth · Time: 45 min · Level: senior/staff_

## Setting
You own the search box on a high-traffic site. As a user types, they expect a dropdown of relevant, popular completions to appear after every keystroke, ranked by how often people actually search for them.

## The ask
Design the system that, given a partial query, returns the top-K completions ranked by popularity, updated as real query traffic changes over time.

## Given constraints
- ~1B searches/day feeding the popularity signal; the autocomplete endpoint itself serves far more requests (one per keystroke)
- p99 latency budget < 50 ms per keystroke — this is on the critical path of every character typed
- Suggestions should reflect recent trends (a breaking-news term should surface within minutes) without a full index rebuild
- Must support prefix matching efficiently at scale, and degrade gracefully (no suggestions rather than a slow or broken search box) if the ranking service is unhealthy
- Personalization/localization is a bonus — a correct, fast, un-personalized version is the core bar

## Deliverables
Requirements → estimates (QPS, index size) → data structure choice (trie / other) and how popularity counts feed it → high-level diagram (query-log ingestion, ranking/aggregation, serving index) → 1–2 deep dives → trade-offs. Likely probes: how the serving index stays both fast and fresh, the trie/alternative trade-off at this scale, and the graceful-degradation path.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
