# Study notes: rate limiter

## Key trade-offs
- **Algorithm.** A token bucket allows bursts up to its capacity and is cheap to store. A fixed window is the simplest and allows double the limit across a boundary. A sliding window is smoother and costs more memory or an approximation. Pick based on whether bursts are acceptable to the backend.
- **Central store or local counters.** A shared store enforces one limit across the fleet and puts a network hop on every request. Local counters are fast and let the effective limit grow with node count. A common compromise is local budgets leased from the shared count, which trades some accuracy for far fewer remote calls.
- **Accuracy or latency.** Exact counting needs an atomic operation per request on a shared key. Approximate counting, with batching or asynchronous sync, keeps the 5 ms budget and lets a key overshoot briefly. Say how much overshoot the contract tolerates.
- **Fail open or fail closed.** Failing open keeps paying customers working when the limiter breaks, and allows abuse while it is down. Failing closed protects backends and turns a limiter fault into an outage. You can fail open per tenant class and keep a coarse local limit as a floor.
- **Config propagation.** Pushing quota changes gives fast effect and needs a delivery channel. Polling or short caches are simpler and lag by the interval.

## Common mistakes
- **A counter in each gateway's memory.** The limit then multiplies with the node count and shifts as nodes scale or restart.
- **Separate read and increment steps.** Two requests can both read below the limit and both pass. The check and update must be one atomic operation.
- **Not explaining what the client sees.** Return a clear rejection with retry timing, so well-behaved clients back off instead of hammering.
- **Hot keys on one store shard.** A single tenant with huge traffic puts all its counter operations on one node. Plan for that with local aggregation or splitting the counter.
- **Forgetting that the limiter is a dependency.** Under the same surge it is meant to stop, its own store can saturate. Size it for peak, with timeouts and a defined fallback.
