# Design a real-time collaborative document editor
_Company: generic · Mode: depth · Time: 45 min · Level: senior/staff_

## Setting
You're building the real-time layer behind a collaborative document editor (Google Docs-style): multiple people type into the same document at once, and every participant's screen needs to converge to the same content, with each person's cursor visible to the others.

## The ask
Design the system that lets N clients edit the same document concurrently, merges their concurrent edits correctly, and keeps everyone's view in sync in real time.

## Given constraints
- Documents up to a few hundred pages; up to ~50 concurrent editors on a single popular document
- Two people typing in the same paragraph at the same moment must both have their changes preserved and end up with the same resulting text on every client — no silent overwrite
- A client that briefly disconnects (flaky wifi) must reconnect and catch up to the current state without re-syncing the whole document from scratch
- Keystroke-to-screen latency for the local typist must feel instant, even before the edit round-trips to the server or other clients
- The document must persist durably — a server restart must not lose in-flight edits

## Deliverables
Requirements → merge strategy (OT / CRDT, and why) → high-level diagram (client, real-time transport, merge/sequencing service, persistence) → 1–2 deep dives → trade-offs. Likely probes: how concurrent edits to the same region are merged deterministically, how a reconnecting client catches up cheaply, and where persistence happens without adding to typing latency.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
