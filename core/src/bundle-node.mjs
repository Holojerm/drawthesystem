/**
 * bundle-node.mjs — the filesystem half of ./bundle.mjs: read a drawthesystem
 * checkout (sessions/ + progress.md) into a bundle, and apply resolved import
 * actions back onto it. Node/Bun only; Workers use ./bundle.mjs with their own
 * storage.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  CANVAS_FILES,
  SESSION_MD_FILES,
  SPEC_FILES,
  createBundle,
  fingerprintProgress,
  fingerprintSession,
  isSessionName,
  parseProgressMd,
  sessionFromFiles,
  sessionToFiles,
  upsertProgressMd,
} from "./bundle.mjs";

const ALL_FILES = [...Object.values(SESSION_MD_FILES), ...Object.values(CANVAS_FILES), ...Object.values(SPEC_FILES)];

/** Every bundle-relevant file in a session folder, as `{ filename: text }`. */
export function readSessionDir(dir) {
  const files = {};
  for (const file of ALL_FILES) {
    const p = join(dir, file);
    if (existsSync(p)) files[file] = readFileSync(p, "utf8");
  }
  return files;
}

/** Session directory names under `<root>/sessions`, newest first. */
export function listSessionNames(root) {
  const dir = join(root, "sessions");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && isSessionName(d.name))
    .map(d => d.name)
    .sort()
    .reverse();
}

export function readProgress(root) {
  const p = join(root, "progress.md");
  return existsSync(p) ? parseProgressMd(readFileSync(p, "utf8")) : [];
}

/**
 * Build a bundle from a checkout. `only` limits it to the named sessions (their
 * progress rows come along); otherwise everything goes.
 */
export function readRepoBundle(root, { only, source = "oss" } = {}) {
  const names = listSessionNames(root).filter(n => !only || only.includes(n));
  const missing = (only ?? []).filter(n => !names.includes(n));
  if (missing.length) throw new Error(`no such session(s): ${missing.join(", ")}`);
  const sessions = names.map(name => sessionFromFiles(name, readSessionDir(join(root, "sessions", name))));
  const chosen = new Set(names);
  const progress = readProgress(root).filter(p => chosen.has(p.sessionName));
  return createBundle({ sessions, progress, source });
}

/** What planImport() needs to know about a checkout. */
export function readRepoState(root) {
  const sessions = listSessionNames(root).map(name => ({
    name,
    fingerprint: fingerprintSession(sessionFromFiles(name, readSessionDir(join(root, "sessions", name)))),
  }));
  const progress = readProgress(root).map(p => ({ sessionName: p.sessionName, fingerprint: fingerprintProgress(p) }));
  return { sessions, progress };
}

/**
 * Write a session entry into `<root>/sessions/<name>`. Only files present in
 * the bundle are written — a replace never deletes local extras (state.json,
 * an older transcript the bundle lacks), it overwrites what the bundle has.
 */
export function writeSessionDir(root, entry) {
  const dir = join(root, "sessions", entry.name);
  mkdirSync(dir, { recursive: true });
  const files = sessionToFiles(entry);
  for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text);
  return Object.keys(files);
}

/** Apply resolveImport() actions to a checkout. Returns what was written. */
export function applyRepoActions(root, actions) {
  const written = [];
  for (const a of actions.sessions) {
    if (a.kind === "skip") continue;
    const files = writeSessionDir(root, a.session);
    written.push({ name: a.targetName, kind: a.kind, files });
  }
  const rows = actions.progress.filter(p => p.kind === "upsert").map(p => p.row);
  if (rows.length) {
    const p = join(root, "progress.md");
    const current = existsSync(p) ? readFileSync(p, "utf8") : "";
    writeFileSync(p, upsertProgressMd(current, rows));
  }
  return { sessions: written, progressRows: rows.length };
}
