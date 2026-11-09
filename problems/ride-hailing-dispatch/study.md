# Study notes: ride-hailing dispatch

## Key trade-offs
- **Spatial index choice.** Geohash cells are simple, work with ordinary key-value stores and have uneven density, with awkward neighbours at cell edges. A quadtree adapts to dense areas and is harder to shard and update. Fixed-size cells are easy to reason about, and a busy city centre will overload one.
- **Cell size.** Small cells make each lookup cheap and need more cells to search and more updates when a driver crosses a boundary. Large cells reduce crossings and return more candidates to filter. Density should drive it, so you may need different sizes for city and countryside.
- **Match quality or speed.** Taking the nearest available driver immediately is fast and can be a poor global choice. Batching requests for a few seconds and solving the assignment together improves overall wait time and delays every rider slightly. Surge is where batching pays off most.
- **Location update handling.** Writing every ping to durable storage is expensive at millions of drivers and a few seconds apart. Keeping the live position in memory and sampling to durable storage for history is far cheaper. Define what you lose if the memory store restarts.
- **Locking a driver.** Claiming a driver with a conditional update prevents double-booking and needs a timeout so a driver who never answers is released. Short timeouts keep the pool moving and lose some willing drivers. Offering a request to several drivers at once speeds matching and wastes some drivers' attention.

## Common mistakes
- **Scanning all drivers for each request.** Distance against a whole city of drivers does not fit a few-second budget.
- **Check-then-assign.** Two matchers can see the same driver as free and both book them. The claim must be one atomic step.
- **Querying a single cell.** The nearest driver is often just over an edge, so search neighbouring cells and sort by real distance.
- **Using straight-line distance only.** A driver across a river or on the other side of a one-way system can be many minutes away. Use an estimated travel time at least for the final ranking.
- **No handling of a driver who declines or disappears.** Without timeouts and reassignment, riders wait on a match that will never arrive.
