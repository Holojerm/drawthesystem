# Study notes: notification system

## Key trade-offs
- **Idempotency key source and scope.** A caller-supplied key lets a retry after a timeout be recognised, since the server cannot know the first request arrived. Scoping it too narrowly lets duplicates through, and too broadly suppresses legitimate repeats. Retain keys long enough to cover real retry windows and no longer.
- **One queue or several priority lanes.** A single queue is simple and lets a marketing blast delay a login code. Separate lanes by urgency need their own capacity and rate limits so bulk traffic cannot starve or flood the fast path. Isolation costs more idle capacity.
- **When to check preferences.** Checking opt-outs and quiet hours at enqueue time stops work early, and the data can change before delivery. Checking at send time is current and adds a lookup to every dispatch. Many systems do both, with a cached lookup at send.
- **Delivery semantics.** At-least-once with dedup downstream is practical. At-most-once drops messages on any failure, which is wrong for security alerts. The weak spot is the vendor call, since a timeout does not tell you whether the message went out.
- **Retry, fall back or park.** Retrying with backoff handles transient vendor errors. Falling back to another channel keeps delivery moving and may send something the user did not want, or twice. Parking in a delayed queue protects the system and delays the message, so define a time after which sending is pointless.

## Common mistakes
- **Preferences enforced by each caller.** With hundreds of teams, someone will forget, and a user who opted out gets a message anyway. Enforcement belongs in the shared service.
- **Unbounded retries.** A vendor outage then grows queues without limit, and when the vendor recovers, a flood of stale messages goes out at once.
- **Treating every failure the same.** A transient error, an invalid token and an unsubscribed address need different handling. Retrying a permanent failure forever wastes capacity.
- **Ignoring time zones.** Quiet hours are local to the user, not to the server, and daylight saving shifts move them.
- **No delivery tracking beyond "sent".** Without vendor callbacks and statuses, you cannot answer whether a message arrived or find a broken channel.
