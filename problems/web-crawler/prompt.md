# Design a web crawler
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're building the crawler that feeds a search index: given a set of seed URLs, discover and fetch web pages at scale, extract links and content, and keep the index reasonably fresh without hammering any one site.

## The ask
Design the system that crawls the web starting from a seed set, discovers new URLs from fetched pages, and re-crawls pages on a freshness schedule.

## Given constraints
- Target throughput: ~1B pages/month; billions of URLs in the frontier at steady state
- Politeness: no more than a few requests/sec to any single host, honoring robots.txt and crawl-delay
- Avoid re-crawling unchanged content wastefully, but detect and re-fetch pages that change frequently (news) faster than ones that don't (archives)
- Must not crawl the same URL twice concurrently, and must dedupe near-identical URLs (tracking params, session ids)
- A single malicious or misconfigured site (infinite link mazes, crawler traps) must not consume a disproportionate share of the fleet

## Deliverables
Requirements → estimates (frontier size, fetch rate) → data model (URL frontier, dedupe, content store) → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: how the frontier is partitioned/prioritized per host, dedupe/near-duplicate detection, and the crawl-trap defense.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
