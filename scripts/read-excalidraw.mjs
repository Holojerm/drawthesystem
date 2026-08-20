#!/usr/bin/env bun
/**
 * read-excalidraw.mjs — summarise a .excalidraw file as text so Claude can
 * critique a diagram without parsing raw JSON.
 *
 * Usage: bun scripts/read-excalidraw.mjs path/to/diagram.excalidraw [--json]
 *
 * Output (markdown): a list of boxes (shapes with their labels), connections
 * (arrows with endpoints + labels), containers (large shapes enclosing others),
 * and any free-floating text. Text bound to a shape or arrow (containerId) is
 * its label; unbound text is attributed to the shape it overlaps, if any.
 * Connections and container members use the first line of a label as the name.
 *
 * Implementation lives in core/src/read-excalidraw.mjs (@sysdesign/core) —
 * this is a thin CLI over it.
 */
import { readFileSync } from "node:fs";
import { summarizeExcalidraw, renderSummaryMarkdown } from "../core/src/read-excalidraw.mjs";

const [, , path, flag] = process.argv;
if (!path) { console.error("usage: read-excalidraw.mjs <file.excalidraw> [--json]"); process.exit(1); }

const doc = JSON.parse(readFileSync(path, "utf8"));
const summary = summarizeExcalidraw(doc, { file: path });
console.log(flag === "--json" ? JSON.stringify(summary, null, 2) : renderSummaryMarkdown(summary));
