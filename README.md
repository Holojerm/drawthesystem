# sysdesign-prep

Practice system design interviews with **any AI coding agent** + **Excalidraw**, tailored to the company you're interviewing with. Optional voice mode.

Works with anything that speaks the open [Agent Skills](https://agentskills.io) format — Claude Code, Codex CLI, Cursor, Gemini CLI, OpenCode, Copilot, … — and therefore with whichever model you already pay for. Zero dependencies beyond Node ≥ 20.

## Quick start

```bash
git clone https://github.com/<you>/sysdesign-prep && cd sysdesign-prep
claude        # or: codex, cursor, gemini, opencode … — the skills are auto-discovered
```

```
/research stripe https://stripe.com/jobs/…     # → companies/stripe/profile.md (eng blog, scale, stack, reported prompts)
/scenario stripe 3 --breadth                    # → sessions/2026-08-18-stripe-ledger/{prompt,interviewer,canvas.excalidraw,notes}
/mock --voice                                   # live timed interview, spoken; say "look at the diagram" any time → feedback.md
   …or work async, then…
/critique                                       # reviews canvas.excalidraw + notes.md against the rubric → feedback.md
/solution                                       # reference architecture as solution.excalidraw + solution.md + diff vs. yours
/progress                                       # trends per rubric dimension, what to drill next
```

If your agent doesn't auto-discover `skills/`, point it there (Claude Code and Codex find the `.claude/skills` / `.agents/skills` symlinks; others accept a `--skills` path or a project config).

## Excalidraw round-trip

The agent can't drive excalidraw.com, so the diagram travels as a file:

- **Open a canvas the agent generated:** `node scripts/to-clipboard.mjs <file>.excalidraw`, then Cmd+V on [excalidraw.com](https://excalidraw.com). (Or ☰ → Open and pick the file.)
- **Give your drawing back:** ☰ → *Save to…* and overwrite `sessions/<dir>/canvas.excalidraw`. Then `/critique`, or say "look at the diagram" during `/mock`.
- **See what the agent sees:** `node scripts/read-excalidraw.mjs sessions/<dir>/canvas.excalidraw`

## Voice mode

```bash
node scripts/voice.mjs serve      # opens http://localhost:7788 in your browser; click "Start listening"
```
Then `/mock --voice`. The interviewer's turns are spoken (browser TTS), your answers are transcribed (browser STT — Web Speech API, so Chrome or Safari; free, no keys, nothing leaves your machine except what Chrome's recogniser sends to Google). Push-to-talk (hold Space) is available for noisy rooms. Set `VOICE_TTS=say` on macOS to use the system voice instead. The two `PLUGGABLE` functions in `scripts/voice.mjs` are the seam for OpenAI Realtime / ElevenLabs / Deepgram if you want premium voices.

## Scripts (Node ≥ 20, zero deps)

| Script | Purpose |
|---|---|
| `scripts/excalidraw.mjs spec.json out.excalidraw` | Build a valid diagram from a small JSON graph spec (nodes with `layer`/`kind`, edges, groups, notes). Schema in the header; `examples/sample-spec.json` is a worked example. |
| `scripts/read-excalidraw.mjs file.excalidraw [--json]` | Summarise any `.excalidraw` (including freehand ones) as boxes / arrows / labels / containers, flagging unlabelled shapes and dangling arrows. |
| `scripts/to-clipboard.mjs file.excalidraw` | Put a diagram on the clipboard in Excalidraw's paste format (macOS). |
| `scripts/voice.mjs serve\|speak\|listen\|status\|log` | Browser-native voice bridge used by `/mock --voice`. |

## Grading

Everything grades against [`rubric/rubric.md`](rubric/rubric.md): 10 dimensions scored 1–5 with explicit senior vs. staff bars, plus diagram-hygiene checks and common failure modes. Edit it to match the level you're targeting.

## Web research

`/research` uses whatever web search / fetch tools your agent exposes. If it has none, paste the job description and a few engineering-blog URLs and it will work from those.

## Tips
- Talk out loud (or type what you'd say, not polished prose). Communication is graded.
- Redraw a solution from memory the next day and `/critique` it again — spaced repetition beats rereading `solution.md`.
- `/scenario generic <topic>` gives classic problems (rate limiter, news feed, ticketing) with no company research.

## Contributing
Skills are plain markdown; scripts are plain Node. PRs welcome — especially new `kind`s / layouts for the diagram generator, better heuristics in `read-excalidraw.mjs` for freehand diagrams, and premium voice adapters.

MIT.
