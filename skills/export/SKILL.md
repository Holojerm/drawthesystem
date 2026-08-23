---
name: export
description: Pack this checkout's practice work (sessions + progress) into one JSON bundle to import into Draw the System cloud or another checkout. Usage — /export [out.json] [--only <session>,<session>]
license: MIT
---

# /export [out.json] [--only <session>,…]

One command, one file:

```
bun scripts/bundle.mjs export [out.json] [--only <session>,<session>]
```

- Default file name: `drawthesystem-export-YYYY-MM-DD.json` at the repo root (git-ignored). Pass a path to put it elsewhere.
- `--only` limits the bundle to the named session dirs (their `progress.md` rows come along); default is every session in `sessions/` plus every row in `progress.md`. Company profiles are not included — they are research, not work.
- The bundle is the cloud's own account-export format, so it imports without conversion: **Account → Import** in the cloud app, or `bun scripts/bundle.mjs import <file>` in another checkout.

What to tell the user after running it: the path, the session count, and any session listed as `no interviewer.md` (the bundle carries it when present — it stays hidden in the cloud; the cloud only hands it back once the session is graded).

If the user asks for a single session, `--only` it. Never edit the JSON by hand — regenerate it.
