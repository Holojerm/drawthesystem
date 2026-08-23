// Runs under `node --test core/test` and `bun test core/test` — no framework.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  copyName,
  fingerprintSession,
  normalizeBundle,
  parseProgressMd,
  parsePromptHeader,
  parseSessionName,
  planImport,
  renderPlan,
  resolveImport,
  sessionFromFiles,
  sessionToFiles,
  upsertProgressMd,
} from "../src/bundle.mjs";
import { applyRepoActions, readRepoBundle, readRepoState } from "../src/bundle-node.mjs";

const PROMPT = "# Design a URL shortener\n_Company: acme · Mode: depth · Time: 60 min · Level: senior/staff_\n\n## The ask\n";
const DOC = { type: "excalidraw", version: 2, elements: [{ id: "a", type: "rectangle" }], appState: {} };
const NAME = "2026-08-18-acme-url-shortener";

function repo(sessions = {}, progress = "") {
  const root = mkdtempSync(join(tmpdir(), "dts-bundle-"));
  for (const [name, files] of Object.entries(sessions)) {
    mkdirSync(join(root, "sessions", name), { recursive: true });
    for (const [f, text] of Object.entries(files)) writeFileSync(join(root, "sessions", name, f), text);
  }
  if (progress) writeFileSync(join(root, "progress.md"), progress);
  return root;
}

test("parses session names and prompt headers", () => {
  assert.deepEqual(parseSessionName(NAME), { date: "2026-08-18", company: "acme", topic: "url-shortener" });
  assert.equal(parseSessionName("notes"), null);
  assert.deepEqual(parsePromptHeader(PROMPT), { title: "Design a URL shortener", company: "acme", mode: "depth", minutes: 60 });
});

test("session folder ⇄ bundle entry round-trips", () => {
  const entry = sessionFromFiles(NAME, {
    "prompt.md": PROMPT,
    "interviewer.md": "secret",
    "feedback.md": "graded",
    "canvas.excalidraw": JSON.stringify(DOC),
    "canvas-spec.json": JSON.stringify({ title: "x" }),
    "solution.excalidraw": "not json",
  });
  assert.equal(entry.title, "Design a URL shortener");
  assert.equal(entry.companySlug, "acme");
  assert.equal(entry.mode, "depth");
  assert.equal(entry.minutes, 60);
  assert.equal(entry.status, "graded");
  assert.deepEqual(entry.canvases.canvas, DOC);
  assert.equal(entry.canvases.solution, undefined, "invalid canvases are dropped");
  assert.deepEqual(entry.specs.canvas, { title: "x" });

  const files = sessionToFiles(entry);
  assert.deepEqual(Object.keys(files).sort(), ["canvas-spec.json", "canvas.excalidraw", "feedback.md", "interviewer.md", "prompt.md"]);
  assert.equal(files["prompt.md"], PROMPT);
  assert.equal(fingerprintSession(sessionFromFiles(NAME, files)), fingerprintSession(entry));
});

test("withheld interviewer notes never become a file", () => {
  const entry = sessionFromFiles(NAME, { "prompt.md": PROMPT });
  entry.interviewerMd = null;
  assert.equal(sessionToFiles(entry)["interviewer.md"], undefined);
});

test("progress.md parses and upserts in place", () => {
  const md = upsertProgressMd("", [{ sessionName: NAME, overall: 2.6, weakest: "Estimation", summary: null, gradedVia: "mock" }]);
  assert.match(md, /\| 2026-08-18 \| acme \| url-shortener \| mock \| 2.6 \| Estimation \| sessions\/2026-08-18-acme-url-shortener \|/);
  const rows = parseProgressMd(md);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sessionName, NAME);
  const again = upsertProgressMd(md, [{ sessionName: NAME, overall: 4, weakest: "Scale", summary: null, gradedVia: "async" }]);
  assert.equal(parseProgressMd(again).length, 1, "same session replaces its row");
  assert.match(again, /\| async \| 4.0 \| Scale \|/);
});

test("normalizeBundle accepts old cloud exports keyed by session id", () => {
  const { sessions, progress, warnings } = normalizeBundle({
    format: "drawthesystem.account-export.v1",
    user: { email: "x" },
    sessions: [
      { id: "uuid-1", name: NAME, title: "T", promptMd: PROMPT, interviewerMd: null, canvases: { canvas: DOC, solution: { nope: true } } },
      { name: "bad name" },
    ],
    progress: [{ sessionId: "uuid-1", overall: 3.5, weakest: "Estimation" }, { sessionId: "uuid-9", overall: 1 }],
  });
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].interviewerMd, null);
  assert.equal(sessions[0].status, "active");
  assert.equal(progress.length, 1);
  assert.equal(progress[0].sessionName, NAME);
  assert.equal(warnings.length, 3);
  assert.throws(() => normalizeBundle({ format: "something-else", sessions: [] }), /unknown format/);
});

test("planImport classifies new / identical / conflict and resolves decisions", () => {
  const a = sessionFromFiles(NAME, { "prompt.md": PROMPT });
  const b = sessionFromFiles("2026-08-19-acme-feed", { "prompt.md": "# Feed\n", "feedback.md": "ok" });
  const c = sessionFromFiles("2026-08-20-acme-search", { "notes.md": "n" });
  const bundle = normalizeBundle({
    format: "drawthesystem.account-export.v1",
    sessions: [a, b, c],
    progress: [{ sessionName: b.name, overall: 3 }, { sessionName: "2026-01-01-x-orphan", overall: 2 }],
  });
  const existing = {
    sessions: [{ name: a.name, fingerprint: fingerprintSession(a) }, { name: b.name, fingerprint: "different" }, { name: `${b.name}-2`, fingerprint: "x" }],
    progress: [],
  };
  const plan = planImport(bundle, existing);
  assert.deepEqual(plan.sessions.map(s => s.action), ["identical", "conflict", "new"]);
  assert.deepEqual(plan.progress.map(p => p.action), ["new", "orphan"]);
  assert.match(renderPlan(plan), /CONFLICT/);

  const skipped = resolveImport(plan, bundle);
  assert.deepEqual(skipped.sessions.map(s => s.kind), ["skip", "skip", "create"]);
  assert.equal(skipped.progress[0].kind, "skip", "progress follows a skipped session");

  const copied = resolveImport(plan, bundle, { [b.name]: "copy" });
  assert.equal(copied.sessions[1].kind, "create");
  assert.equal(copied.sessions[1].targetName, `${b.name}-3`, "copy name skips taken names");
  assert.equal(copied.sessions[1].session.name, `${b.name}-3`);
  assert.equal(copied.progress[0].row.sessionName, `${b.name}-3`, "progress follows the copy");

  const replaced = resolveImport(plan, bundle, {}, { onConflict: "replace" });
  assert.equal(replaced.sessions[1].kind, "replace");
  assert.equal(replaced.summary.replaced, 1);
  assert.throws(() => resolveImport(plan, bundle, { [b.name]: "yolo" }), /must be one of/);
});

test("copyName", () => {
  assert.equal(copyName("a", new Set(["a"])), "a-2");
  assert.equal(copyName("a", new Set(["a", "a-2"])), "a-3");
});

test("export from one checkout, import into another", () => {
  const src = repo(
    { [NAME]: { "prompt.md": PROMPT, "interviewer.md": "key", "canvas.excalidraw": JSON.stringify(DOC), "state.json": "{}" } },
    upsertProgressMd("", [{ sessionName: NAME, overall: 2.6, weakest: "Estimation", summary: null, gradedVia: "mock" }]),
  );
  const bundle = readRepoBundle(src);
  assert.equal(bundle.sessions.length, 1);
  assert.equal(bundle.progress.length, 1);

  const dst = repo({ [NAME]: { "prompt.md": "# Older draft\n" } });
  const plan = planImport(normalizeBundle(bundle), readRepoState(dst));
  assert.equal(plan.sessions[0].action, "conflict");
  const result = applyRepoActions(dst, resolveImport(plan, normalizeBundle(bundle), { [NAME]: "replace" }));
  assert.equal(result.sessions[0].kind, "replace");
  assert.equal(readFileSync(join(dst, "sessions", NAME, "prompt.md"), "utf8"), PROMPT);
  assert.equal(readFileSync(join(dst, "sessions", NAME, "interviewer.md"), "utf8"), "key\n");
  assert.ok(existsSync(join(dst, "sessions", NAME, "canvas.excalidraw")));
  assert.equal(parseProgressMd(readFileSync(join(dst, "progress.md"), "utf8"))[0].overall, 2.6);

  const second = planImport(normalizeBundle(bundle), readRepoState(dst));
  assert.equal(second.sessions[0].action, "identical", "a re-import is a no-op");
  assert.equal(second.progress[0].action, "identical");
});
