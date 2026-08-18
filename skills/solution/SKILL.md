---
name: solution
description: Generate a reference architecture for a session as a real .excalidraw diagram plus a written walkthrough and a diff against your attempt. Usage — /solution [session-dir]
license: MIT
---

# /solution [session-dir]

Produce the "model answer" after the user has attempted the scenario. **Refuse (politely) if there is no `feedback.md` yet** — seeing the answer first defeats the practice; offer `/mock` or `/critique` instead. Override with `--force`.

## Steps
1. Read `prompt.md`, `interviewer.md`, `feedback.md`, `rubric/rubric.md`, and the company profile.
2. Design the reference architecture yourself. Aim for what a strong staff candidate would draw in 45 minutes: **minimal, justified, labelled, with numbers** — not an everything-diagram. 8–15 nodes typical.
3. Write `<session>/solution-spec.json` in the spec format documented at the top of `scripts/excalidraw.mjs`:
   - `layer` 0 = clients, then edge (CDN/LB/gateway), then services, then storage/queues, then async consumers/analytics.
   - `kind` per node so colours carry meaning; use `note` on storage nodes for partition key / replication / TTL.
   - Edge labels: verb + protocol or payload; `style: "dashed"` for async.
   - `groups` for service boundaries or regions when they clarify.
   - `notes` block: key numbers, consistency choices, and the crux in one line each (≤ 6 bullets).
4. Run `node scripts/excalidraw.mjs <session>/solution-spec.json <session>/solution.excalidraw`, then `node scripts/read-excalidraw.mjs <session>/solution.excalidraw` and confirm the summary matches your intent (no dangling arrows, every node labelled). Fix the spec and regenerate if not.
5. Write `<session>/solution.md`:
```
# Reference solution — <title>
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
6. Print: how to view it — workbench `http://localhost:7788/sessions/<dir>` → *Solution* toggle (read-only, side by side with their canvas via the toggle), or `node scripts/to-clipboard.mjs <session>/solution.excalidraw` → Cmd+V on excalidraw.com — and the *Diff vs. your attempt* section. Suggest they redraw from memory tomorrow and `/critique` again.
