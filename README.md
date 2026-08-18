# sysdesign-prep

Practice system design interviews with Claude Code + Excalidraw, tailored to the company you're interviewing with.

## Loop

```
/research stripe https://stripe.com/jobs/…     # → companies/stripe/profile.md (eng blog, scale, stack, real interview prompts)
/scenario stripe 3 --breadth                    # → sessions/2026-08-18-stripe-ledger/{prompt,interviewer,canvas.excalidraw,notes}
/mock                                           # live timed interview; say "look at the diagram" any time → feedback.md
   …or work async, then…
/critique                                       # reviews canvas.excalidraw + notes.md against rubric → feedback.md
/solution                                       # reference architecture as solution.excalidraw + solution.md + diff vs. yours
/progress                                       # trends by rubric dimension, what to drill next
```

## Excalidraw round-trip

Claude can't drive excalidraw.com directly, so the diagram travels as a file:

- **Open a canvas Claude generated:** `node scripts/to-clipboard.mjs <file>.excalidraw`, then Cmd+V on [excalidraw.com](https://excalidraw.com). (Or ☰ → Open / Cmd+O and pick the file.)
- **Give your drawing back to Claude:** ☰ → *Save to…* and overwrite `sessions/<dir>/canvas.excalidraw`. Then `/critique` or say "look at the diagram" during `/mock`.
- **Sanity check what Claude will see:** `node scripts/read-excalidraw.mjs sessions/<dir>/canvas.excalidraw`

## Scripts (Node ≥ 20, zero deps)

| Script | Purpose |
|---|---|
| `scripts/excalidraw.mjs spec.json out.excalidraw` | Build a valid diagram from a small JSON graph spec (nodes with `layer`/`kind`, edges, groups, notes). See header comment for the schema; `examples/sample-spec.json` is a worked example. |
| `scripts/read-excalidraw.mjs file.excalidraw [--json]` | Summarise any `.excalidraw` (including ones you drew freehand) as boxes / arrows / labels / containers, flagging unlabelled shapes and dangling arrows. |
| `scripts/to-clipboard.mjs file.excalidraw` | Put a diagram on the clipboard in Excalidraw's paste format. |

## Grading

Everything grades against [`rubric/rubric.md`](rubric/rubric.md): 10 dimensions scored 1–5 with senior vs. staff bars, plus diagram-hygiene checks and common failure modes.

## Tips
- Talk out loud during `/mock` — type what you'd say, not polished prose. The interviewer grades communication too.
- Redraw a solution from memory the next day and `/critique` it; spaced repetition beats reading `solution.md` twice.
- Run `/scenario generic <topic>` for classic problems (rate limiter, news feed, ticketing) with no company research.
