# Design a distributed rate limiter
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're on the platform team for a multi-tenant API gateway. Every request from every customer flows through a shared fleet of stateless gateway nodes before reaching backend services, and a handful of noisy tenants have twice taken those services down by bursting far past their contracted quota.

## The ask
Design a rate limiter that the gateway calls on every request to admit or reject it, enforced per API key and per endpoint, consistently across the whole fleet.

## Given constraints
- ~500K requests/sec sustained across the fleet, hundreds of gateway nodes, thousands of distinct API keys with different quotas
- The admit/reject decision must add < 5 ms p99 to every request
- Limits are enforced fleet-wide, not per-node — a key must not get N× its quota by spreading requests across N nodes
- A limiter outage must fail safe (open) for paying customers rather than take down the API, but must still stop an active abuse burst
- Quotas change per-customer (plan upgrades, temporary throttles) and must take effect within seconds, not on the next deploy

## Deliverables
Requirements → estimates → algorithm choice (token bucket / sliding window / etc., and why) → API/data model → high-level diagram → 1–2 deep dives → trade-offs. Likely probes: where the counters live, how nodes agree on a fleet-wide count without a synchronous call per request, and the fail-open/fail-closed decision.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
