# Design a URL shortener at bit.ly scale
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You've joined the platform team at a link-management company. Marketing customers create branded short links and need click analytics; the redirect path is on the critical path of every campaign click on the internet.

## The ask
Design the system that creates short links and serves redirects, including click analytics.

## Given constraints
- ~100M new links/month, ~10B redirects/month, heavy tail (a handful of links get 1M+ clicks/hour during launches)
- p99 redirect latency < 50 ms globally
- Links live for years; analytics must be near-real-time (< 1 min) for dashboards
- Custom aliases must be globally unique; abuse/malware links must be killable within seconds

## Deliverables
Requirements → estimates → API/data model → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: the redirect hot path, ID generation, and analytics ingestion.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
