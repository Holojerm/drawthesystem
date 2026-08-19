#!/usr/bin/env bun
/**
 * session.mjs — shared interview clock between the agent and the workbench.
 *
 *   bun scripts/session.mjs start <session-dir> [--minutes 45]   # writes <dir>/state.json; workbench timer starts from it
 *   bun scripts/session.mjs elapsed <session-dir>                 # prints "MM:SS elapsed · MM:SS left" (exit 3 when over time)
 *   bun scripts/session.mjs pause <session-dir>                   # stop the clock (setup, tooling, a break) — paused time doesn't count
 *   bun scripts/session.mjs resume <session-dir>                  # restart it
 *   bun scripts/session.mjs stop <session-dir>                    # records endedAt
 *
 * state.json: { startedAt, minutes, endedAt, pausedAt, pausedMs } — the workbench reads the same file.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const [, , cmd, dir, ...rest] = process.argv;
if (!cmd || !dir) { console.error("usage: session.mjs start|elapsed|pause|resume|stop <session-dir> [--minutes N]"); process.exit(1); }
const p = join(dir, "state.json");
const read = () => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
const write = st => writeFileSync(p, JSON.stringify(st, null, 2));
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
const elapsedMs = st => ((st.endedAt ?? st.pausedAt ?? Date.now()) - st.startedAt) - (st.pausedMs ?? 0);
if (cmd === "start") {
  const i = rest.indexOf("--minutes"); const minutes = i > -1 ? Number(rest[i + 1]) : (read().minutes ?? 45);
  const st = { ...read(), startedAt: Date.now(), minutes, endedAt: null, pausedAt: null, pausedMs: 0 };
  write(st); console.log(`started ${new Date(st.startedAt).toLocaleTimeString()} · ${minutes} min`);
} else if (cmd === "elapsed") {
  const st = read(); if (!st.startedAt) { console.log("not started"); process.exit(2); }
  const el = elapsedMs(st), left = st.minutes * 60000 - el;
  console.log(`${fmt(el)} elapsed · ${left >= 0 ? fmt(left) + " left" : fmt(-left) + " OVER"}${st.pausedAt ? " · PAUSED" : ""}`); if (left < 0) process.exit(3);
} else if (cmd === "pause") {
  const st = read(); if (!st.startedAt || st.endedAt) { console.log("not running"); process.exit(2); }
  if (st.pausedAt) { console.log("already paused"); process.exit(0); }
  st.pausedAt = Date.now(); write(st); console.log(`paused at ${fmt(elapsedMs(st))} elapsed`);
} else if (cmd === "resume") {
  const st = read(); if (!st.pausedAt) { console.log("not paused"); process.exit(2); }
  st.pausedMs = (st.pausedMs ?? 0) + (Date.now() - st.pausedAt); st.pausedAt = null; write(st);
  console.log(`resumed · ${fmt(elapsedMs(st))} elapsed · ${fmt(st.minutes * 60000 - elapsedMs(st))} left`);
} else if (cmd === "stop") {
  const st = read();
  if (st.pausedAt) { st.pausedMs = (st.pausedMs ?? 0) + (Date.now() - st.pausedAt); st.pausedAt = null; }
  st.endedAt = Date.now(); write(st); console.log("stopped");
} else { console.error("unknown command"); process.exit(1); }
