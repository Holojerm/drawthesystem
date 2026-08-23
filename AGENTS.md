# Draw the System

System design interview practice for any coding agent that supports [Agent Skills](https://agentskills.io): research a target company, build a company-flavoured scenario, play interviewer (text or voice), critique Excalidraw diagrams, generate reference architectures, track progress.

## Layout
- `skills/<name>/SKILL.md` — `/research`, `/scenario`, `/mock`, `/critique`, `/solution`, `/progress`, `/export`, `/import`. Each SKILL.md is the source of truth for that flow. `.claude/skills` and `.agents/skills` are symlinks to `skills/` for auto-discovery.
- `skills/research/references/researcher.md` — the research playbook (`/research` may delegate it to a subagent if the host supports one).
- `core/` — `@drawthesystem/core` workspace package: the excalidraw generator/reader as importable, zero-dep ESM functions, plus the skill/rubric markdown exposed as importable content (`core/content/` imports the source files live — nothing is copied or generated). Consumed live (path dependency) by the cloud product, so edits to `skills/**`, `rubric/rubric.md`, or `core/` flow downstream automatically with no extra step. Adding/renaming a skill is the one change that touches core (an import line in `core/content/index.mjs`).
- `scripts/excalidraw.mjs` — spec JSON → `.excalidraw` (layered auto-layout, coloured by `kind`); schema in the file header. Thin CLI over `core/src/excalidraw.mjs`.
- `scripts/read-excalidraw.mjs` — `.excalidraw` → markdown summary of boxes/arrows/labels (`--json` for raw). This is how the agent "sees" a diagram. Thin CLI over `core/src/read-excalidraw.mjs`.
- `scripts/bundle.mjs` — `export [out.json]` / `import <file> [--dry-run] [--decide …]`: one JSON bundle of `sessions/` + `progress.md`, in the cloud product's account-export format (schema in `core/src/bundle.mjs`), so work moves in both directions. Import always plans first (new / identical / conflict per session) and never deletes. Thin CLI over `core/src/bundle.mjs` (pure) + `core/src/bundle-node.mjs` (fs).
- `scripts/to-clipboard.mjs` — copies a `.excalidraw` to the clipboard so Cmd+V pastes it into excalidraw.com (macOS `pbcopy`).
- `scripts/session.mjs` — `start|elapsed|pause|resume|stop <session>` shared interview clock (`<session>/state.json`); the workbench timer follows it (shows ⏸ while paused).
- `scripts/voice.mjs` — `speak "<text>"` / `listen` / `status` / `log` CLI used by `/mock --voice`; targets the workbench's `/api/voice/*` when it's running, else `serve` runs a zero-dep fallback page.
- `web/` — Nuxt 4 + Nuxt UI workbench (`bun run web`, http://localhost:7788; `.claude/launch.json` defines a `workbench` target for hosts with a preview/browser tool): dashboard, companies, session workspace with Excalidraw embedded natively and **autosaving to `sessions/<id>/canvas.excalidraw`**, notes editor, feedback/solution tabs, timer, voice panel. The agent never calls the workbench except via `scripts/voice.mjs`; it reads/writes the same files.
- `rubric/rubric.md` — 10-dimension senior/staff rubric + diagram checks; all grading references it.
- `companies/<slug>/profile.md` — research output · `sessions/<date>-<slug>-<topic>/` — one folder per session · `progress.md` — one row per graded session.

## Conventions (apply regardless of which agent/model is running)
- Never reveal `interviewer.md` during `/mock` — it is the hidden answer key.
- Never fabricate company facts; profiles cite sources or say "not found" / "paste-only".
- Generate diagrams via `scripts/excalidraw.mjs` from a spec — don't hand-write element JSON — and verify with `read-excalidraw.mjs` afterwards. Keep the spec next to its output (`canvas-spec.json`, `solution-spec.json`, `solution-45min-spec.json`) so it can be edited and regenerated.
- Diagram round-trip: the user draws in the workbench (autosave) or at excalidraw.com (*Save to…*); either way the agent reads `<session>/canvas.excalidraw` from disk only.
- Web research: use whatever search/fetch tools the host provides (load them first if the host defers tools); if none, ask the user for URLs or pasted text.
- Batch runs (many `/research` + `/scenario` in parallel subagents) take an hour or more: on macOS run `caffeinate -dis` first — idle sleep kills in-flight agents — and have each agent write its profile draft early so an interrupted run still leaves output.
- Bun ≥ 1.2 (`scripts/` also run under Node ≥ 20). `scripts/`, `core/`, and `skills/` are zero-dependency; only `web/` has a `node_modules`. Scripts are invoked relative to the repo root and import `core/` by relative path, so a fresh clone runs them with no install.
- Session dir names are `YYYY-MM-DD-<slug>-<topic>` (the workbench parses this); `prompt.md` starts with `# Title` and a `_Company: … · Mode: breadth|depth · Time: N min …_` line.
- Grade to the senior/staff bar unless the scenario says otherwise — depth of justification and finding the crux unled, not breadth of drawing. `/solution` produces both `solution.excalidraw` (full map, for study) and `solution-45min.excalidraw` (what a strong candidate actually draws in the room).
