#!/usr/bin/env node
/**
 * to-clipboard.mjs — copy a .excalidraw file to the macOS clipboard in
 * Excalidraw's clipboard format, so you can just press Cmd+V on excalidraw.com.
 *
 * Usage: node scripts/to-clipboard.mjs path/to/diagram.excalidraw
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const [, , path] = process.argv;
if (!path) { console.error("usage: to-clipboard.mjs <file.excalidraw>"); process.exit(1); }
const doc = JSON.parse(readFileSync(path, "utf8"));
const payload = JSON.stringify({ type: "excalidraw/clipboard", elements: doc.elements, files: doc.files ?? {} });
const r = spawnSync("pbcopy", { input: payload });
if (r.status !== 0) { console.error("pbcopy failed"); process.exit(1); }
console.log(`copied ${doc.elements.length} elements — open https://excalidraw.com and press Cmd+V`);
