---
name: critique
description: Async review of your Excalidraw diagram (+ notes) for a session against the scenario and rubric; writes feedback.md. Usage — /critique [session-dir] [path/to/other.excalidraw]
license: MIT
---

# /critique [session-dir] [diagram-path]

Grade a diagram you drew on your own time. Same rubric as `/mock`, but diagram-centred and with more teaching.

## Steps
1. Resolve session dir (arg, else most recent). Diagram = explicit path arg, else `<session>/canvas.excalidraw`. If the file is missing or only contains the starter title/legend, tell the user to draw in the workbench (`http://localhost:7788/sessions/<dir>`, autosaves) or save from excalidraw.com to that path, and stop.
2. Read `prompt.md`, `interviewer.md`, `notes.md` (if the user filled it), `rubric/rubric.md`.
3. Run `node scripts/read-excalidraw.mjs <diagram>` and read the summary. If it looks mis-parsed (many `<unlabelled>` or `?` endpoints), also run with `--json` and reason from coordinates. Never guess at what an unlabelled box "probably" is — call it out.
4. Reconstruct the design from the diagram + notes: components, read path, write path, sync/async, storage choices, partitioning, caching, failure handling. State explicitly what is **inferable from the artefact** vs. **absent**. In a real interview, absent from the whiteboard ≈ absent unless spoken.
5. Compare against `interviewer.md`'s crux and expected deep dives.
6. Write `<session>/feedback.md`:
```
# Critique — <title> (<date>)
Diagram: <path> · Notes: yes/no

## What I see (neutral reconstruction, 5–10 bullets)
## Diagram hygiene  (each rubric diagram check: ✅/⚠️/❌ + fix)
## Design review
### Meets the requirements? (walk read path & write path; name any request that can't be served)
### Scale & bottlenecks (use the scenario's numbers)
### Failure & consistency
### The crux — found / partially / missed, and why it matters here
## Rubric scores (only dimensions assessable from a diagram+notes: 3,4,6,7, and 10-diagram-legibility; others "n/a — needs a live session")
## Three highest-leverage changes (concrete: "add X between A and B labelled Y because Z")
## Questions an interviewer would ask next (5, escalating)
```
7. Append the `progress.md` row (mode = `async`). Offer `/solution` for a reference diagram, and `/mock` on the same session to practise defending it live.

## Tone
Direct, specific, senior-peer. Praise only what's actually good. Every criticism paired with what a strong answer does instead.
