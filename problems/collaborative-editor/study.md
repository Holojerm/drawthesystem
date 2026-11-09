# Study notes: collaborative editor

## Key trade-offs
- **Operational transformation or CRDT.** OT keeps documents compact and has years of production use, but needs a central server to order operations and the transform functions are famously easy to get wrong. A CRDT merges without a central authority and handles offline editing naturally, but carries per-character metadata and needs garbage collection. A server-centric product with online users leans OT; offline-first or peer-to-peer leans CRDT.
- **Optimistic local apply or wait for the server.** Applying your own edit immediately is what makes typing feel instant, and it means the client holds state the server has not confirmed. That forces a rebase of local pending edits whenever remote edits arrive. Waiting for a round trip is simple and unusable on a slow link.
- **Operation log or periodic snapshots.** Storing every operation gives history, undo and catch-up from any version, but the log grows without bound. Snapshots make loading fast and bound the log, but lose detail. Most systems keep both and compact the log behind the latest snapshot.
- **Granularity of operations.** Per-character operations are simple and precise, but chatty. Batching keystrokes into small groups cuts traffic and storage at the price of slightly later visibility for others. The 50-editor ceiling means this is a real cost, not just a detail.
- **How strongly to persist.** Durably writing every operation before acknowledging it is safest and puts storage latency on the typing path. Acknowledging from memory and persisting in small batches is fast and risks a short window of loss. Decide what a server crash is allowed to cost.

## Common mistakes
- **Last write wins on a region of text.** Two people typing in the same paragraph is the normal case. Overwriting one of them silently destroys work and users notice immediately.
- **Naming a merge approach without showing convergence.** Saying "we use a CRDT" is not an answer. You need to show why two clients that apply the same set of edits in different orders end up with the same text.
- **Sending the whole document on every change.** Cost grows with document length, not edit size, and a few hundred pages makes it unusable.
- **Ignoring intent in position-based edits.** An insert at index 40 means something different once someone else has inserted before it. Edits that are not transformed or anchored to stable identities corrupt the text.
- **Forgetting cursors and presence are a separate stream.** They are high frequency, ephemeral and fine to drop. Writing them to the durable log wastes storage and slows real edits.
