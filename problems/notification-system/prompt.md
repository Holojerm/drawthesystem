# Design a cross-channel notification system
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
Dozens of internal services need to notify users — push, SMS, email, in-app — and today each one calls its own vendor integration directly, with no shared rate limiting, user preferences, or delivery tracking.

## The ask
Design a shared notification service: internal services submit a notification request, the service picks the right channel(s), respects user preferences and quiet hours, and tracks delivery.

## Given constraints
- ~2B notifications/day across channels, hundreds of internal services as callers
- A user's channel preferences (opted out of SMS, quiet hours 10pm–8am local) must be honored consistently regardless of which internal service triggered the notification
- Must not double-send the same logical notification if a caller retries after a timeout
- Time-sensitive notifications (security alerts, OTP codes) need a fast path with tighter latency than a marketing digest
- Vendor outages (a push provider down) must degrade gracefully — retry, fall back to another channel, or queue — without backing up the whole system

## Deliverables
Requirements → estimates → API (what a calling service sends) → high-level diagram (ingestion, preference/dedup layer, channel adapters, delivery tracking) → 1–2 deep dives → trade-offs. Likely probes: idempotency/dedup, the fast path for time-sensitive alerts, and vendor-failure isolation.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
