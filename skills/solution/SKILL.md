---
name: solution
description: Generate a reference architecture for a session as a real .excalidraw diagram plus a written walkthrough and a diff against your attempt. Usage — /solution [session-dir]
license: MIT
---

# /solution [session-dir]

Produce the "model answer" after the user has attempted the scenario. **Refuse (politely) if there is no `feedback.md` yet** — seeing the answer first defeats the practice; offer `/mock` or `/critique` instead. Override with `--force`.

## Steps
1. Read `prompt.md`, `interviewer.md`, `feedback.md`, `rubric/rubric.md`, and the company profile.
2. Design the reference architecture yourself: **complete, justified, labelled, with numbers** — 12–20 nodes. This is the full map for study, not what anyone draws in 45 minutes.
   Then also produce `<session>/solution-45min-spec.json` → `solution-45min.excalidraw`: what a strong staff candidate *actually* draws in the room — 10–12 boxes, the crux decisions, and a `notes` block with the 4–5 numbers they'd say out loud.
3. Write `<session>/solution-spec.json` in the spec format documented at the top of `scripts/excalidraw.mjs`:
   - `layer` = column left→right (clients → edge → services → storage/queues → async consumers → analytics). Pin `row` to build clean bands (e.g. row 0 control plane, row 1 real-time flow, row 2 its stores, row 3 customer/query). Keep most edges between adjacent columns; for the few long or backward ones set `via: "top"|"bottom"` so they take a lane around the diagram. Don't draw every "writes to DB" arrow — annotate the store's label instead and keep the diagram about flow.
   - `kind` per node so colours carry meaning; use `note` on storage nodes for partition key / replication / TTL.
   - Edge labels: verb + protocol or payload; `style: "dashed"` for async.
   - `groups` for service boundaries or regions when they clarify.
   - `notes` block: key numbers, consistency choices, and the crux in one line each (≤ 6 bullets).
4. Run `bun scripts/excalidraw.mjs <session>/solution-spec.json <session>/solution.excalidraw`, then `bun scripts/read-excalidraw.mjs <session>/solution.excalidraw` and confirm the summary matches your intent (no dangling arrows, every node labelled, groups contain only their members). Fix the spec and regenerate if not — the workbench *Solution* view refreshes on its own.
5. Write `<session>/solution.md`:
```
# Reference solution — <title>
## What a strong 45-minute answer actually looks like — point at solution-45min.excalidraw; the ~60 s of spoken numbers; the crux in one sentence each; which one deep dive; the trade-offs named when asked. State plainly that the full map below is for study, not the bar for the room: Staff vs Senior is justification depth and finding the crux unled, not coverage.
## Requirements as I'd state them (functional / non-functional / out of scope)
## Estimates (3–6 lines, show the arithmetic)
## API & data model (endpoints/events; entities with keys and why)
## Architecture walkthrough — read path, write path, async path; each component's job in one line
## Deep dive: <the crux component> — algorithm/protocol/data structure level
## Deep dive: <second most likely probe>
## Trade-offs table — decision | chosen | alternative | why here
## Failure modes & mitigations (5–8)
## Scaling to 10× — what changes first
## Diff vs. your attempt — 3–6 bullets from feedback.md: what you had, what's different, why it matters
## Talk track — 60-second summary you could say out loud
```
6. Print: how to view it — workbench `http://localhost:7788/sessions/<dir>` → *Solution* toggle (read-only, side by side with their canvas via the toggle), or `bun scripts/to-clipboard.mjs <session>/solution.excalidraw` → Cmd+V on excalidraw.com — and the *Diff vs. your attempt* section. Suggest they redraw from memory tomorrow and `/critique` again.
