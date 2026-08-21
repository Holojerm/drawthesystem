#!/usr/bin/env bun
/**
 * excalidraw.mjs — build a valid .excalidraw file from a simple graph spec.
 *
 * Usage:
 *   bun scripts/excalidraw.mjs spec.json out.excalidraw
 *   cat spec.json | bun scripts/excalidraw.mjs - out.excalidraw
 *
 * Spec format (JSON):
 * {
 *   "title": "Optional title rendered at top",
 *   "nodes": [
 *     { "id": "client", "label": "Mobile Client", "kind": "client", "layer": 0 },
 *     { "id": "api",    "label": "API Gateway",   "kind": "service", "layer": 1 },
 *     { "id": "db",     "label": "Postgres\n(orders)", "kind": "db", "layer": 3, "note": "sharded by user_id" }
 *   ],
 *   "edges": [
 *     { "from": "client", "to": "api", "label": "HTTPS" },
 *     { "from": "api", "to": "db", "label": "read/write", "style": "dashed" }
 *   ],
 *   "groups": [ { "label": "Order Service", "nodes": ["api", "db"] } ],
 *   "notes": [ "Assumption: 10k writes/s peak" ]
 * }
 *
 * Layout: nodes are placed in columns by `layer` (0 = leftmost) and stacked
 * vertically in the order given (group members first when `groups` exist, so a
 * group's frame is a clean band — keep each group's members in adjacent layers
 * and at most one per column where possible). Override with explicit `x`,`y`.
 * `row` (optional) pins a node to a grid row within its layer (0 = top) — use it to
 * build clean bands (e.g. row 0 control plane, row 1 real-time, row 2 pipeline).
 * Edges are routed orthogonally with distributed ports; `via: "top"|"bottom"` forces
 * a lane route around the diagram for a long/backward edge.
 * `kind` picks a colour: client | service | db | cache | queue | storage |
 * external | lb | cdn | note (default: service).
 * Node height grows with the label (wrapped to the node width), so 4–6 line
 * labels don't clip; rows take the height of their tallest node. Edge labels are
 * real Excalidraw arrow labels (text bound to the arrow), so the workbench treats
 * them like hand-made ones and read-excalidraw attributes them to the edge.
 *
 * Implementation lives in core/src/excalidraw.mjs (@drawthesystem/core) — this is
 * a thin CLI over it; the spec doc above is mirrored there, keep both in sync.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildExcalidraw } from "../core/src/excalidraw.mjs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: excalidraw.mjs <spec.json|-> <out.excalidraw>");
  process.exit(1);
}
const raw = inPath === "-" ? readFileSync(0, "utf8") : readFileSync(inPath, "utf8");
const spec = JSON.parse(raw);
writeFileSync(outPath, JSON.stringify(buildExcalidraw(spec), null, 2));
console.log(`wrote ${outPath} (${spec.nodes?.length ?? 0} nodes, ${spec.edges?.length ?? 0} edges)`);
