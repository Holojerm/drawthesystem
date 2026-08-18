# sysdesign-prep

**Practice system design interviews with any AI coding agent, a real Excalidraw canvas, and your voice — tailored to the company you're interviewing with.**

Your agent (Claude Code, Codex CLI, Cursor, Gemini CLI, OpenCode, …) plays researcher, interviewer, and grader via portable [Agent Skills](https://agentskills.io). A local Nuxt workbench gives you the whiteboard, the brief, a timer, and a talk-to-the-interviewer panel. Everything is files in this repo — no accounts, no hosted service, no vendor lock-in on the model.

```
/research stripe <job-url>      # eng blog, talks, scale numbers, real interview prompts → companies/stripe/profile.md
/scenario stripe 3              # company-flavoured prompt + hidden interviewer notes + blank canvas → sessions/…
/mock --voice                   # timed, spoken mock interview; "look at the diagram" any time → feedback.md
/critique                       # async: grade your canvas + notes against the rubric
/solution                       # reference architecture as .excalidraw + walkthrough + diff vs. yours
/progress                       # trends per rubric dimension, what to drill next
```

## Quick start

```bash
git clone https://github.com/jeremyettlinger/sysdesign-prep && cd sysdesign-prep
bun install && bun run web        # workbench at http://localhost:7788 (Bun ≥ 1.2)
```

In a second terminal at the repo root start your agent (`claude`, `codex`, …) — the skills in `skills/` are auto-discovered — and run `/research <company>` then `/scenario <slug>`. Open the session in the workbench, hit the timer, and `/mock --voice`.

Want to try it before researching anything? `bun run demo` drops a sample session in `sessions/`.

## What's in the box

| Piece | What it does |
|---|---|
| `skills/*/SKILL.md` | The six skills above, in the open Agent Skills format. Plain markdown; edit freely. |
| `skills/research/references/researcher.md` | Research playbook: what to look for, what to never fabricate, the profile template. Uses whatever web tools your agent has; falls back to pasted JD/URLs. |
| `rubric/rubric.md` | 10 dimensions, 1–5, with explicit senior vs. staff bars, diagram checks, and common failure modes. All grading references it. |
| `web/` | Nuxt 4 + Nuxt UI workbench: dashboard, company profiles & seeds, session workspace with **Excalidraw embedded natively** (autosaves to `canvas.excalidraw`), notes, feedback/solution tabs, timer, and the voice/transcript panel. Dark mode. |
| `scripts/excalidraw.mjs` | Tiny JSON graph spec → valid `.excalidraw` (layered auto-layout, colour by `kind`). How the agent draws reference solutions. |
| `scripts/read-excalidraw.mjs` | Any `.excalidraw` (including freehand) → markdown summary of boxes, arrows, labels, groupings, dangling arrows. How the agent *sees* your diagram. |
| `scripts/voice.mjs` | `speak` / `listen` CLI the interviewer skill calls; talks to the workbench, or runs a zero-dep fallback page (`serve`). Browser-native Web Speech API — no keys. |
| `scripts/to-clipboard.mjs` | Paste any generated diagram into excalidraw.com with Cmd+V, if you'd rather not run the workbench. |

Sessions and company profiles are git-ignored (they're yours); `progress.md` is tracked so your fork keeps its history.

## How the pieces talk

```
 terminal: your agent ──runs──▶ skills/*.md ──read/write──▶ sessions/<id>/{prompt,interviewer,notes,feedback,solution}.md
                     │                                       sessions/<id>/canvas.excalidraw ◀──autosave── workbench (Excalidraw)
                     └──bun scripts/voice.mjs speak|listen──▶ workbench /api/voice ◀──▶ browser STT/TTS
```
The agent never talks to the browser directly; it reads and writes files and calls two tiny CLIs. That's what keeps it model- and agent-agnostic.

## Voice

Browser-native (Web Speech API): free, no keys, works in Chrome and Safari. Push-to-talk (hold Space) for noisy rooms; pick the system voice and rate in the panel. Chrome sends recognition audio to Google; Safari runs on-device. Premium engines (OpenAI Realtime, ElevenLabs, Deepgram) plug into the two `PLUGGABLE` functions in `web/app/composables/useVoice.ts`.

## Without the workbench

Everything works with plain files: `bun scripts/to-clipboard.mjs <file>.excalidraw` → Cmd+V on excalidraw.com → *Save to…* back over `sessions/<id>/canvas.excalidraw`. `bun scripts/voice.mjs serve` gives you a bare voice page.

## Contributing

PRs welcome — especially: better freehand-diagram heuristics in `read-excalidraw.mjs`, more `kind`s/layouts in the generator, premium voice adapters, and rubric variants (e.g. ML system design, mid-level). Keep the core zero-dependency; the workbench is the only place with a `node_modules`.

MIT © Jeremy Ettlinger
