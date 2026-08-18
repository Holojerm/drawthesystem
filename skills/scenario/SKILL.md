---
name: scenario
description: Create a company-flavoured system design scenario + session folder (prompt, hidden interviewer notes, blank Excalidraw canvas). Usage — /scenario <company-slug|generic> [seed # | topic] [--depth|--breadth] [--minutes 45]
license: MIT
---

# /scenario

Turn a company profile into a concrete, timed practice scenario.

## Inputs
- `<company-slug>` — must match `companies/<slug>/profile.md`; or `generic` for a classic problem with no company flavour.
- Optional seed number (from the profile's *Scenario seeds*) or free-text topic. If omitted, pick the seed that best matches the role and that the user hasn't done yet (check `progress.md`).
- `--depth` (one component, implementation-level) or `--breadth` (whole system). Default: breadth for the first session with a company, then alternate.
- `--minutes N` default 45.

## Steps
1. Read `companies/<slug>/profile.md` (skip for `generic`) and `progress.md` (past sessions, weak dimensions).
2. Create `sessions/<YYYY-MM-DD>-<slug>-<short-topic>/` containing:
   - `prompt.md` — what the candidate sees (see template below).
   - `interviewer.md` — hidden: expected clarifying questions & good answers, key numbers, the 2–3 "crux" decisions, expected deep-dive targets, follow-up probes ordered by difficulty, red flags, and a rubric emphasis line pointing at the user's historically weak dimensions. **Do not show this file to the user during the session.**
   - `canvas.excalidraw` — a starter canvas: title text + a small legend of colours (client / service / db / cache / queue / storage). Generate it with `bun scripts/excalidraw.mjs` from a spec that has only the title and a `notes` block listing the legend; nodes list may be empty.
   - `notes.md` — empty template with headings: Requirements / Estimates / API & data model / High-level / Deep dive / Trade-offs / Open questions.
3. Print the prompt and how to open the canvas — two options, workbench first:
   - **Workbench** (recommended): `bun run web` (once), then open `http://localhost:7788/sessions/<dir>`. Drawing autosaves to `canvas.excalidraw`; voice and notes live there too.
   - **excalidraw.com**: `bun scripts/to-clipboard.mjs sessions/<dir>/canvas.excalidraw`, Cmd+V on excalidraw.com, and *Save to…* back over `canvas.excalidraw` when done.
4. Offer: `/mock` (add `--voice` if the workbench is open) to run it live now, or work async and `/critique` later.

## prompt.md template
```
# <Title>
_Company: <name> · Mode: breadth|depth · Time: N min · Level: senior/staff_

## Setting
2–4 sentences framing the problem in the company's world, using their real product surface (from the profile) but not requiring insider knowledge.

## The ask
One clear design task. E.g. "Design the system that lets a rider see live ETAs for nearby drivers."

## Given constraints
- 3–6 bullets: scale numbers grounded in the profile (cite "public numbers suggest ~X"), latency/consistency/regulatory needs.

## Deliverables (what a strong answer covers)
Requirements → estimates → API/data model → high-level diagram → 1–2 deep dives → trade-offs. Say which deep-dives are most likely to be probed *without* giving away the crux.

## Rules
Think aloud. Draw in Excalidraw. Ask clarifying questions — I will answer as the interviewer.
```

## Quality bar
- The scenario should feel like it came from *this* company's interview loop, not a generic textbook question.
- Include at least one non-obvious constraint that forces a real trade-off.
- Numbers must be plausible and consistent with the profile.
