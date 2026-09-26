# Interviewer notes (hidden)
Crux: hot-path redirect must not touch the primary DB — CDN/edge cache + regional cache with kill-switch propagation; ID generation without coordination (base62 of a range-allocated counter or KGS); analytics via async stream, not inline writes.
Probes: what happens on cache miss storm for a viral link; how do you kill a malicious link in <5s if it's cached at the edge (short TTL vs purge API vs kill-list check); custom alias uniqueness (unique index / CAS); counting clicks exactly vs approximately.
Red flags: writing click events synchronously to Postgres; hashing the long URL and ignoring collisions; no story for cache invalidation.
