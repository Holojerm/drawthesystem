# Study notes: web crawler

## Key trade-offs
- **Frontier structure.** One global priority queue is simple and makes per-site politeness an extra check. Queues partitioned by host build politeness in and need a scheduler to pick between hosts. At a billion pages a month, a host-aware structure is closer to a requirement than an optimisation.
- **Breadth-first or priority-driven.** Breadth-first covers the web evenly and wastes effort on low-value pages. Prioritising by importance, change rate or link signals finds valuable content sooner and requires computing those signals and avoids starving the rest.
- **URL dedup structure.** Storing every seen URL exactly is certain and large. A Bloom filter is compact and occasionally says a new URL was seen, so you miss a page. Choose based on how costly a missed page is against memory at billions of URLs.
- **Content dedup.** Exact hashes catch identical pages. Near-duplicate detection such as fingerprinting catches templated pages and costs more per page. Doing it saves index space and crawl effort.
- **Recrawl policy.** A fixed interval is easy and over-fetches static pages. Adapting the interval to observed change finds updates sooner for less bandwidth and needs history per URL. Conditional requests with validators reduce the cost of a check.

## Common mistakes
- **No per-host rate limit.** A fast crawler overloads small sites, gets blocked and damages its reputation. Honour robots.txt and a per-host delay.
- **Only depth limits against traps.** A site can generate unlimited URLs at shallow depth. Cap pages per host, watch for URL patterns and repeated content, and normalise parameters.
- **Exact URL matching only.** Tracking parameters, session ids, fragments and case differences produce many URLs for one page. Canonicalise before checking whether you have seen it.
- **Fetching and parsing in one tightly coupled step.** A slow site holds a worker, and a parse failure loses the fetch. Separate fetch, parse and link extraction through queues.
- **Not handling failure and politeness over time.** Hosts that time out or return errors need backoff and retry limits, or the crawler spends its capacity on dead sites.
