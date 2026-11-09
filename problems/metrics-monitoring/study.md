# Study notes: metrics monitoring

## Key trade-offs
- **Push or pull collection.** Pulling from each target gives you a built-in health signal, since a failed scrape is itself data, and needs service discovery and reachability. Pushing works through firewalls and from short-lived jobs, and a silent sender looks the same as an idle one. Large fleets often mix them.
- **Label cardinality.** Rich labels such as customer id or request path make slicing easy. Each unique combination creates a new series, and index size and query cost follow the series count, not the point count. Decide which labels are allowed and cap the rest.
- **Where to aggregate.** Rolling up at ingestion cuts storage and speeds common queries, and loses the ability to ask new questions of the raw points. Keeping raw data is flexible and costs money fast at 50M points a second. Keep raw for a short window and pre-aggregate for dashboards you know about.
- **Downsampling and percentiles.** Averaging old data into coarser buckets is cheap, and an average of p99s is not a p99. Store histograms or sketches if you want percentiles to survive downsampling.
- **Alert evaluation freshness.** Evaluating rules against the incoming stream is fast and needs its own capacity and state. Querying the store on a schedule is simpler and adds query latency and load. A one-minute target limits how late either can be.

## Common mistakes
- **Keeping all raw points forever.** Storage grows linearly while almost nobody queries year-old data at full resolution.
- **Paging on every evaluation where the condition is true.** One ongoing incident turns into dozens of pages. Alerts need state: pending, firing, resolved.
- **Putting the monitoring system inside what it monitors.** If it shares a cluster, network or deploy pipeline with the services, it fails with them and says nothing. An independent heartbeat check is needed.
- **Ignoring missing data.** A dead service emits no points, so "value over threshold" never fires. Decide how absence is treated.
- **Running alert rules as heavy dashboard queries.** Hundreds of thousands of rules each scanning history will compete with users and miss the one-minute deadline.
