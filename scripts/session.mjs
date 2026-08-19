#!/usr/bin/env bun
/**
 * session.mjs — shared interview clock between the agent and the workbench.
 *
 *   bun scripts/session.mjs start <session-dir> [--minutes 45]   # writes <dir>/state.json; workbench timer starts from it
 *   bun scripts/session.mjs elapsed <session-dir>                 # prints "MM:SS elapsed · MM:SS left" (exit 3 when over time)
 *   bun scripts/session.mjs stop <session-dir>                    # records endedAt
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const [, , cmd, dir, ...rest] = process.argv;
if (!cmd || !dir) { console.error("usage: session.mjs start|elapsed|stop <session-dir> [--minutes N]"); process.exit(1); }
const p = join(dir, "state.json");
const read = () => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
if (cmd === "start") {
  const i = rest.indexOf("--minutes"); const minutes = i > -1 ? Number(rest[i + 1]) : (read().minutes ?? 45);
  const st = { ...read(), startedAt: Date.now(), minutes, endedAt: null };
  writeFileSync(p, JSON.stringify(st, null, 2)); console.log(`started ${new Date(st.startedAt).toLocaleTimeString()} · ${minutes} min`);
} else if (cmd === "elapsed") {
  const st = read(); if (!st.startedAt) { console.log("not started"); process.exit(2); }
  const el = (st.endedAt ?? Date.now()) - st.startedAt, left = st.minutes * 60000 - el;
  console.log(`${fmt(el)} elapsed · ${left >= 0 ? fmt(left) + " left" : fmt(-left) + " OVER"}`); if (left < 0) process.exit(3);
} else if (cmd === "stop") {
  const st = read(); st.endedAt = Date.now(); writeFileSync(p, JSON.stringify(st, null, 2)); console.log("stopped");
} else { console.error("unknown command"); process.exit(1); }
