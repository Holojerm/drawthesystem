# sysdesign-prep

System design interview practice for any coding agent that supports [Agent Skills](https://agentskills.io): research a target company, build a company-flavoured scenario, play interviewer (text or voice), critique Excalidraw diagrams, generate reference architectures, track progress.

## Layout
- `skills/<name>/SKILL.md` — `/research`, `/scenario`, `/mock`, `/critique`, `/solution`, `/progress`. Each SKILL.md is the source of truth for that flow. `.claude/skills` and `.agents/skills` are symlinks to `skills/` for auto-discovery.
- `skills/research/references/researcher.md` — the research playbook (`/research` may delegate it to a subagent if the host supports one).
- `scripts/excalidraw.mjs` — spec JSON → `.excalidraw` (layered auto-layout, coloured by `kind`); schema in the file header.
- `scripts/read-excalidraw.mjs` — `.excalidraw` → markdown summary of boxes/arrows/labels (`--json` for raw). This is how the agent "sees" a diagram.
- `scripts/to-clipboard.mjs` — copies a `.excalidraw` to the clipboard so Cmd+V pastes it into excalidraw.com (macOS `pbcopy`).
- `scripts/voice.mjs` — zero-dep voice bridge: `serve` opens a browser page using Web Speech API; `speak "<text>"` / `listen` are what `/mock --voice` calls.
- `rubric/rubric.md` — 10-dimension senior/staff rubric + diagram checks; all grading references it.
- `companies/<slug>/profile.md` — research output · `sessions/<date>-<slug>-<topic>/` — one folder per session · `progress.md` — one row per graded session.

## Conventions (apply regardless of which agent/model is running)
- Never reveal `interviewer.md` during `/mock` — it is the hidden answer key.
- Never fabricate company facts; profiles cite sources or say "not found" / "paste-only".
- Generate diagrams via `scripts/excalidraw.mjs` from a spec — don't hand-write element JSON — and verify with `read-excalidraw.mjs` afterwards.
- Excalidraw round-trip: the user edits at excalidraw.com and saves back to `<session>/canvas.excalidraw`; the agent reads from disk only.
- Web research: use whatever search/fetch tools the host provides; if none, ask the user for URLs or pasted text.
- Node ≥ 20, zero dependencies. Scripts are invoked relative to the repo root.
- Grade to the senior/staff bar unless the scenario says otherwise.
