# Design a file sync service (Dropbox-style)
_Company: generic · Mode: breadth · Time: 45 min · Level: senior/staff_

## Setting
You're building the sync engine behind a cloud storage product: a user edits files in a local folder on multiple devices, and every device should converge to the same contents without the user thinking about it.

## The ask
Design the system that detects a local file change, uploads it efficiently, and propagates it to the user's other devices — including handling two devices editing the same file while offline.

## Given constraints
- ~500M files synced across ~100M devices; average file is small, but some files are multi-GB
- Only the changed portion of a large file should be re-uploaded/re-downloaded on an edit, not the whole file
- A device that's been offline for weeks must catch up correctly without re-downloading everything from scratch
- Two devices editing the same file while both offline is a real case — the system must not silently lose either version
- Sync should feel near-instant for small edits on a good connection, and must not saturate a slow connection so badly the device becomes unusable

## Deliverables
Requirements → estimates → chunking/diffing approach → data model (file versions, device state) → high-level diagram (client watcher, sync protocol, storage) → 1–2 deep dives → trade-offs. Likely probes: block-level diffing for large files, conflict detection and resolution, and how a long-offline device resyncs efficiently.

## Rules
Think aloud. Draw in the canvas. Ask clarifying questions — I will answer as the interviewer.
