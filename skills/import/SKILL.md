---
name: import
description: Bring practice work exported from Draw the System cloud (or another checkout) into this repo — preview, resolve conflicts per session, then write sessions/ and progress.md. Usage — /import <file.json>
license: MIT
---

# /import <file.json>

The file is a `drawthesystem-export-*.json` from the cloud app (Account → Export) or from `/export` in another checkout.

1. **Preview first — always.**
   ```
   bun scripts/bundle.mjs import <file.json> --dry-run
   ```
   It prints a table: one row per session and per progress row, each marked `new`, `identical — skip`, or `CONFLICT` (same session name, different content). Show the table to the user.
2. **Nothing to decide?** (no conflicts) Run it for real:
   ```
   bun scripts/bundle.mjs import <file.json>
   ```
3. **Conflicts:** ask the user, per session, which they want — batch it in one question:
   - `skip` — keep the local version (default).
   - `replace` — the bundle's files overwrite the local ones. Only files present in the bundle are written; nothing is deleted.
   - `copy` — import as `<session-name>-2` alongside the local one.
   Then run with their answers:
   ```
   bun scripts/bundle.mjs import <file.json> --decide <session>=replace,<session>=copy
   ```
   `--on-conflict replace|copy` applies one choice to every conflict when the user says "all of them".
4. Report what was created / replaced / skipped and how many `progress.md` rows were merged (rows for an existing session replace its line; a `copy` gets its own row under the new name). Point the user at the workbench — imported sessions appear there immediately.

Notes:
- A session whose `interviewer.md` was withheld by the cloud (it is the hidden answer key until the session is graded) imports without that file; `/mock` on it needs a `/scenario` pass to regenerate the notes.
- Identical sessions are never rewritten, so re-importing the same file is a no-op.
- Do not hand-edit the bundle; if it fails to parse, ask the user for a fresh export.
