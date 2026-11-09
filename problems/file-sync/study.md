# Study notes: file sync

## Key trade-offs
- **Fixed-size or content-defined chunks.** Fixed blocks are trivial to compute and index, but inserting a byte near the start shifts every later block, so the whole tail looks changed. Content-defined chunking picks boundaries from the data, so an edit changes only nearby chunks, at the cost of more CPU on the client and variable chunk sizes.
- **Chunk size.** Small chunks give finer deltas and better dedup but more metadata and more requests. Large chunks reduce overhead and re-upload more per edit. Average files here are small, so a single size for everything wastes effort on one end or the other.
- **Poll or push for changes.** Polling the server on a timer is simple and burns requests across 100M devices. A long-lived notification channel tells devices when to fetch, which is cheaper at scale but needs reconnect and missed-event handling. Either way, the notification should carry a hint and not the data.
- **Conflict policy.** Keeping both versions and surfacing a conflicted copy never loses data and sometimes annoys users. Automatic merge works for some formats and cannot be correct for binaries. Last writer wins is the simplest and loses work whenever two offline edits meet.
- **Global dedup or per-user.** Deduplicating chunks across all users saves a lot of storage, but lets someone probe whether a file already exists, and complicates deletion and encryption. Per-user dedup is safer and saves less.

## Common mistakes
- **Uploading the whole file on every change.** A multi-gigabyte file with a one-line edit then costs gigabytes of bandwidth, and sync feels broken on slow links.
- **Identifying changes by modification time alone.** Clocks differ between devices, and tools rewrite timestamps without changing content. Content hashes are the source of truth, with timestamps as a cheap first filter.
- **Walking the full tree to find what changed.** A device that comes back after weeks cannot afford to compare everything. It needs a server-side change sequence it can ask for "everything since" a token.
- **Metadata and file bytes in one system.** The directory tree needs transactions and fast listing, while blobs need cheap bulk storage. Mixing them gives you the worse properties of both.
- **No resumable or throttled transfers.** Large uploads over flaky or slow links must resume where they stopped and must leave bandwidth for the rest of the device.
