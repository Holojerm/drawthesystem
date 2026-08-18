# System Design Interview Rubric (Senior / Staff)

Score each dimension 1–5. Overall bar for Senior ≈ 3.5 avg with no 1s; Staff ≈ 4+ avg with ≥4 on Deep Dive, Trade-offs, and Communication.

| # | Dimension | 1 (weak) | 3 (solid) | 5 (staff+) |
|---|-----------|----------|-----------|------------|
| 1 | **Requirements & scoping** | Jumps to boxes; never asks who the users are or what "done" means | Clarifies functional + non-functional reqs, states what's out of scope | Identifies the *hard* requirement that shapes the design (e.g. consistency vs. availability, fan-out ratio) and drives everything from it |
| 2 | **Estimation** | None, or numbers pulled from air | Back-of-envelope QPS / storage / bandwidth with stated assumptions | Uses estimates to make decisions (e.g. "fits in one Redis box, so no sharding yet") and revisits them when scope changes |
| 3 | **API & data model** | Vague or missing | Clear endpoints/events, core entities, keys, indexes | Chooses keys/partitioning with access patterns in mind; calls out hot keys, cardinality, schema evolution |
| 4 | **High-level architecture** | Missing components or a single monolith with no data flow | All major components present with labelled data flow, sync vs. async marked | Minimal design that meets the requirements; every box justifies its existence; clear request path and write path |
| 5 | **Deep dive** | Stays at 10,000 ft | Goes deep on 1–2 components chosen by the interviewer | Proactively picks the riskiest/most interesting component, explains algorithms/data structures/protocols at implementation level |
| 6 | **Scalability & performance** | Hand-waves "add more servers" | Identifies bottlenecks; applies caching, sharding, replication, queues appropriately | Quantifies headroom, discusses tail latency, backpressure, hot partitions, and what breaks at 10× |
| 7 | **Reliability & consistency** | Ignores failure | Discusses replication, failover, retries, idempotency, at-least-once vs. exactly-once | Reasons about partial failures, consistency models per component, durability guarantees, and blast radius |
| 8 | **Trade-offs** | Presents one option as obviously correct | Names alternatives and picks one with reasons | Frames trade-offs in terms of the requirements; knows when the "textbook" answer is wrong here; changes mind when given new constraints |
| 9 | **Operability** | Not mentioned | Monitoring, alerting, deploy strategy, rollbacks | Capacity planning, migration plan, cost awareness, on-call implications, multi-region |
| 10 | **Communication & drive** | Interviewer has to drag every step out; diagram is unreadable | Structured, thinks aloud, checks in, diagram is legible and labelled | Owns the session: sets an agenda, time-boxes, summarises, uses the diagram as a shared artefact, handles pushback gracefully |

## Diagram-specific checks (for /critique)

- Every box labelled with *what it is* and ideally *what it stores / does*
- Arrows show direction and are labelled with protocol/payload/verb where it matters
- Sync vs. async paths visually distinct (solid vs. dashed)
- Read path and write path both traceable client → storage
- Storage components annotate partition key / replication
- No dangling arrows or orphaned boxes
- Groupings/boundaries (service, region, trust boundary) where they aid understanding
- Numbers on the diagram: QPS, sizes, TTLs, retention

## Common senior-level failure modes to watch for

- Diving into a specific technology (Kafka! Cassandra!) before establishing the requirement it satisfies
- Never producing a number
- One consistency model for the whole system
- Forgetting the write path (or the read path)
- No idempotency story for retries
- Treating the cache as free (invalidation, stampedes, cold start)
- Silence while drawing
- Not managing time: 30 min on requirements, 5 min on design
