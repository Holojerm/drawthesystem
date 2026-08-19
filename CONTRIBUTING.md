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

- `skills/` and `scripts/` stay dependency-free and runtime-agnostic (Bun or Node ≥ 20). Only `web/` has dependencies.
- Skills are plain markdown in the [Agent Skills](https://agentskills.io) format; keep them model- and agent-agnostic — no vendor-specific tool names.
- Diagrams are generated from specs via `scripts/excalidraw.mjs`, never hand-written element JSON.
- Never commit `sessions/` or `companies/` content.
- Open an issue before large changes; small fixes can go straight to a PR.
