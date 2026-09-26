# Design a metrics monitoring and alerting system
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
Thousands of internal services emit numeric metrics (request rate, latency, error count) continuously. Engineers need dashboards over that data and want to be paged when a metric crosses a threshold — within minutes of it actually happening, not after the fact.

## The ask
Design the system that ingests metrics from every service, stores them queryably over time, and evaluates alerting rules against them in near-real-time.

## Given constraints
- ~50M metric data points/sec ingested at peak, from ~100K hosts/containers
- Dashboards need to query arbitrary time ranges and aggregations (sum, p99, rate) over the last minutes to the last year, with the oldest data acceptably coarser-grained
- An alert must fire within ~1 minute of the underlying condition being true, and must not spam the same page ten times for one ongoing incident
- The monitoring system itself failing must not go unnoticed — it needs to be observable independently of the systems it watches
- Storage cost must not grow unbounded — old high-resolution data should be downsampled, not kept forever at full fidelity

## Deliverables
Requirements → estimates (ingestion volume, storage growth) → data model (time series storage, downsampling) → high-level diagram (ingestion, storage, query, alert evaluation) → 1–2 deep dives → trade-offs. Likely probes: the ingestion hot path at this write volume, downsampling/retention strategy, and alert deduplication.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
