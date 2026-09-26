# Design a ride-hailing dispatch system
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're on the marketplace team at a ride-hailing app: riders request a trip, nearby drivers are shown or matched, and both sides need to see each other's live location for the duration of the trip.

## The ask
Design the system that matches a rider's request to a nearby available driver and keeps both apps updated with live location until pickup.

## Given constraints
- ~5M concurrent drivers reporting location during peak hours, location updates every 3–5 s per active driver
- Match latency: a rider should see a matched driver within a few seconds of requesting
- A driver can only be matched to one rider at a time; two dispatch attempts must never double-book the same driver
- Surge periods (a big event ending) spike both demand and the number of "nearby" candidates the matcher has to consider in a small radius
- Driver and rider apps need live location updates during the match wait and the ride itself, not just at request time

## Deliverables
Requirements → estimates (location update volume, geo-index size) → data model / geo-indexing approach → high-level diagram (location ingestion, matching, live tracking) → 1–2 deep dives → trade-offs. Likely probes: how you index and query "nearby available drivers" at this scale, the double-booking race, and how live location reaches both apps efficiently.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
