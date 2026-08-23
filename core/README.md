# @drawthesystem/core

The shared brain of drawthesystem: the excalidraw spec→document generator and
document→summary reader as importable functions, plus the skill and rubric
markdown exposed as importable content. Zero dependencies, pure ESM, no build
step; runs under Node ≥ 20, Bun ≥ 1.2, and Cloudflare Workers.

The OSS repo consumes it through the thin CLI shims in `scripts/` (which import
by relative path, so a fresh clone works with no install). The commercial app
consumes it as a `link:` path dependency — every build sees the current source
and markdown, so changes here flow downstream automatically.

## Exports

| Subpath | What | Where it runs |
| --- | --- | --- |
| `@drawthesystem/core` (also `./excalidraw`, `./read-excalidraw`) | `buildExcalidraw(spec)`, `summarizeExcalidraw(doc, {file?})`, `renderSummaryMarkdown(summary)` | anywhere |
| `@drawthesystem/core/bundle` (also re-exported from the root) | the import/export bundle format — `normalizeBundle`, `planImport`, `resolveImport`, `sessionFromFiles`/`sessionToFiles`, `parseProgressMd`/`upsertProgressMd`, fingerprints; schema in the file header | anywhere |
| `@drawthesystem/core/bundle/node` | `readRepoBundle(root)`, `readRepoState(root)`, `applyRepoActions(root, actions)` — the same against a checkout's `sessions/` + `progress.md` | Node / Bun |
| `@drawthesystem/core/content` | `skills`, `skillsByName`, `rubricMarkdown`, `rubric` — parsed live from `../skills/**` and `../rubric/rubric.md` via static `.md` imports | bundlers only (see below) |
| `@drawthesystem/core/content/node` | `loadContent()` — same result, read with `node:fs` | Node / Bun |

## Consuming `./content` from a bundler

The content entry statically imports `.md` files; tell your bundler to load
them as text:

- **wrangler** (`wrangler.jsonc`): `"rules": [{ "type": "Text", "globs": ["**/*.md"] }]`
- **Vite/Nuxt**: a tiny plugin (or `?raw` imports): transform `*.md` to `export default <text>`
- **esbuild**: `--loader:.md=text`

The markdown files in `skills/` and `rubric/` are the single source of truth —
never copy their text anywhere. Adding or renaming a skill is the only change
that touches this package (one import line in `content/index.mjs`).

## Tests

`node --test test/*.test.mjs` (also `bun test test/`) — plain `node:test`, no framework.

The spec format for `buildExcalidraw` is documented at the top of
`src/excalidraw.mjs` (and mirrored in `scripts/excalidraw.mjs` at the repo
root, where the skills point agents — keep both headers in sync).
