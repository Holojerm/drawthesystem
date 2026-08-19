# sysdesign-prep

System design interview practice with any AI coding agent, a real Excalidraw canvas, and your voice — tailored to the company you're interviewing with.

Your agent (Claude Code, Codex CLI, Cursor, Gemini CLI, OpenCode, …) plays researcher, interviewer, and grader via portable [Agent Skills](https://agentskills.io). A local Nuxt workbench provides the whiteboard, brief, timer, and voice panel. Everything is files in this repo: no accounts, no hosted service, any model.

```
/research stripe <job-url>   # eng blog, talks, scale, reported prompts → companies/stripe/profile.md
/scenario stripe 3           # company-flavoured prompt + hidden interviewer notes + canvas → sessions/…
/mock --voice                # timed, spoken mock interview; "look at the diagram" any time → feedback.md
/critique                    # async: grade canvas + notes against the rubric
/solution                    # reference architecture: full map + realistic 45-min answer + diff vs. yours
/progress                    # trends per rubric dimension, what to drill next
```

## Quick start

Requires [Bun](https://bun.sh) ≥ 1.2.

```bash
git clone https://github.com/Holojerm/sysdesign-prep && cd sysdesign-prep
bun install && bun run web        # workbench → http://localhost:7788
```

In a second terminal at the repo root, start your agent (`claude`, `codex`, …); skills in `skills/` are auto-discovered. Run `/research <company>`, then `/scenario <slug>`, open the session in the workbench, and `/mock --voice`.

`bun run demo` creates a sample session to try immediately.

## Layout

| Path | Purpose |
|---|---|
| `skills/*/SKILL.md` | The six skills, in the open Agent Skills format |
| `skills/research/references/researcher.md` | Research playbook and profile template |
| `rubric/rubric.md` | 10 dimensions, 1–5, senior vs. staff bars, diagram checks |
| `web/` | Nuxt 4 + Nuxt UI workbench: dashboard, companies, session workspace with embedded Excalidraw (autosaves to `canvas.excalidraw`), notes, feedback/solution tabs, timer, voice panel |
| `scripts/excalidraw.mjs` | JSON graph spec → `.excalidraw` (how the agent draws) |
| `scripts/read-excalidraw.mjs` | `.excalidraw` → text summary of boxes/arrows/labels (how the agent sees your diagram) |
| `scripts/session.mjs` | Shared interview clock (`start` / `elapsed` / `stop`) the workbench timer follows |
| `scripts/voice.mjs` | `speak` / `listen` CLI used by `/mock --voice`; `serve` is a zero-dep fallback page |
| `scripts/to-clipboard.mjs` | Copy a diagram in Excalidraw's paste format for excalidraw.com |

`sessions/` and `companies/` are git-ignored; `progress.md` is tracked.

## How it fits together

```
agent ──runs──▶ skills/*.md ──read/write──▶ sessions/<id>/{prompt,interviewer,notes,feedback,solution}.md
  │                                          sessions/<id>/canvas.excalidraw ◀──autosave── workbench (Excalidraw)
  └──bun scripts/voice.mjs speak|listen──▶ workbench /api/voice ◀──▶ browser STT/TTS
```

The agent only reads/writes files and calls two small CLIs, which keeps it model- and agent-agnostic.

## Voice

Web Speech API: free, no keys, Chrome or Safari. Push-to-talk (hold Space), voice and rate selectable. Chrome sends recognition audio to Google; Safari runs on-device. Premium engines plug into the two `PLUGGABLE` functions in `web/app/composables/useVoice.ts`.

## Without the workbench

`bun scripts/to-clipboard.mjs <file>.excalidraw` → Cmd+V on excalidraw.com → *Save to…* over `sessions/<id>/canvas.excalidraw`. `bun scripts/voice.mjs serve` for a bare voice page.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Wanted: freehand-diagram heuristics in `read-excalidraw.mjs`, more generator `kind`s/layouts, premium voice adapters, rubric variants (ML system design, mid-level).

## License

[MIT](LICENSE)
