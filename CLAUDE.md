# sysdesign-prep

System design interview practice: Claude researches a target company, builds a company-flavoured scenario, plays interviewer, critiques Excalidraw diagrams, and generates reference architectures.

## Layout
- `.claude/skills/*` — `/research`, `/scenario`, `/mock`, `/critique`, `/solution`, `/progress` (each SKILL.md is the source of truth for that flow)
- `.claude/agents/company-researcher.md` — deep-research subagent used by `/research`
- `scripts/excalidraw.mjs` — spec JSON → `.excalidraw` (layered auto-layout, coloured by `kind`); spec format documented at the top of the file
- `scripts/read-excalidraw.mjs` — `.excalidraw` → markdown summary of boxes/arrows/labels (`--json` for raw)
- `scripts/to-clipboard.mjs` — copies a `.excalidraw` to the clipboard so Cmd+V pastes it into excalidraw.com
- `rubric/rubric.md` — 10-dimension senior/staff rubric + diagram checks; all grading references it
- `companies/<slug>/profile.md` — research output; `sessions/<date>-<slug>-<topic>/` — one folder per practice session; `progress.md` — one row per graded session

## Conventions
- Never show `interviewer.md` contents to the user during `/mock`; it's the hidden answer key.
- Never fabricate company facts; the profile cites sources or says "not found".
- Diagrams: always generate via `scripts/excalidraw.mjs` from a spec (don't hand-write element JSON), and always verify with `read-excalidraw.mjs` afterwards.
- Excalidraw round-trip: user edits at excalidraw.com and saves back to `<session>/canvas.excalidraw`; Claude reads from disk only.
- Node ≥ 20, no dependencies.
- User is targeting senior/staff roles; grade to that bar.
