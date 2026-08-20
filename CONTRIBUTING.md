# Contributing

## Setup

```bash
bun install
bun run web          # workbench at http://localhost:7788
bun run demo         # sample session
```

## Checks

```bash
bun run check        # zero-dep scripts
bun run typecheck    # web/
bun run web:build
```

## Guidelines

- `skills/`, `scripts/`, and `core/` stay dependency-free and runtime-agnostic (Bun or Node ≥ 20). Only `web/` has dependencies.
- Generator/reader logic lives in `core/src/` (`@sysdesign/core`); `scripts/excalidraw.mjs` and `scripts/read-excalidraw.mjs` are thin CLI shims that must keep their exact CLI behaviour and import core by relative path (a fresh clone runs them with no install).
- Skills are plain markdown in the [Agent Skills](https://agentskills.io) format; keep them model- and agent-agnostic — no vendor-specific tool names.
- Diagrams are generated from specs via `scripts/excalidraw.mjs`, never hand-written element JSON.
- Never commit `sessions/` or `companies/` content.
- Open an issue before large changes; small fixes can go straight to a PR.
