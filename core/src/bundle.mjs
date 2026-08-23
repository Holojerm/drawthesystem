/**
 * bundle.mjs — the portable bundle that moves practice work between a local
 * drawthesystem checkout and the cloud product, in either direction.
 *
 * The file IS the cloud's account export (`drawthesystem.account-export.v1`),
 * used unchanged as the interchange format — one JSON document, read and
 * written by both sides. Shape:
 *
 * {
 *   "format": "drawthesystem.account-export.v1",
 *   "exportedAt": "2026-08-23T10:00:00.000Z",
 *   "source": "oss" | "cloud",                    // informational
 *   "sessions": [{
 *     "name": "2026-08-18-qualitate-study-platform", // identity on both sides (= session dir name)
 *     "title": "…", "companySlug": "qualitate" | null, "mode": "breadth" | "depth", "minutes": 45,
 *     "status": "draft" | "active" | "graded",
 *     "promptMd": "…", "interviewerMd": "…" | null, "notesMd": "…",
 *     "feedbackMd": "…", "solutionMd": "…", "transcriptMd": "…",
 *     "canvases": { "canvas": <.excalidraw doc>, "solution": …, "solution45": … },
 *     "specs":    { "canvas": <spec JSON>,       "solution": …, "solution45": … },
 *     "createdAt": "…", "updatedAt": "…"            // optional
 *   }],
 *   "progress": [{
 *     "sessionName": "2026-08-18-qualitate-study-platform",
 *     "overall": 2.6, "weakest": "Estimation", "summary": "…" | null,
 *     "gradedVia": "mock" | "async" | null
 *   }]
 * }
 *
 * `interviewerMd` is null when the exporter withheld it (the cloud does so for
 * ungraded sessions — it is the hidden answer key). Cloud exports also carry
 * `user` and `billing`; importers ignore them. Older cloud exports key progress
 * by `sessionId`; normalizeBundle() resolves that to `sessionName`.
 *
 * Everything here is pure (no fs, no DB) so it runs in Node, Bun and Workers.
 * The filesystem half lives in ./bundle-node.mjs; the CLI in scripts/bundle.mjs.
 */

export const BUNDLE_FORMAT = "drawthesystem.account-export.v1";

/** Session markdown columns ⇄ files in a session folder. */
export const SESSION_MD_FILES = {
  promptMd: "prompt.md",
  interviewerMd: "interviewer.md",
  notesMd: "notes.md",
  feedbackMd: "feedback.md",
  solutionMd: "solution.md",
  transcriptMd: "transcript.md",
};

/** Diagram kinds ⇄ files. Mirrors shared/canvas.ts in the cloud repo. */
export const CANVAS_FILES = {
  canvas: "canvas.excalidraw",
  solution: "solution.excalidraw",
  solution45: "solution-45min.excalidraw",
};

/** The generator specs kept next to each diagram so it can be regenerated. */
export const SPEC_FILES = {
  canvas: "canvas-spec.json",
  solution: "solution-spec.json",
  solution45: "solution-45min-spec.json",
};

export const MODES = ["breadth", "depth"];
export const STATUSES = ["draft", "active", "graded"];
export const CONFLICT_CHOICES = ["skip", "replace", "copy"];

const SESSION_NAME_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+)-([a-z0-9][a-z0-9-]*)$/;

/** `YYYY-MM-DD-<company>-<topic>` → parts, or null when it isn't a session name. */
export function parseSessionName(name) {
  const m = typeof name === "string" ? name.match(SESSION_NAME_RE) : null;
  return m ? { date: m[1], company: m[2], topic: m[3] } : null;
}

export function isSessionName(name) {
  return parseSessionName(name) !== null;
}

/**
 * The `# Title` / `_Company: … · Mode: … · Time: N min …_` header that every
 * prompt.md starts with (see skills/scenario/SKILL.md).
 */
export function parsePromptHeader(md) {
  if (typeof md !== "string" || !md) return {};
  const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const company = md.match(/Company:\s*([a-z0-9-]+)/i)?.[1]?.toLowerCase();
  const mode = md.match(/Mode:\s*(breadth|depth)/i)?.[1]?.toLowerCase();
  const minutes = Number(md.match(/Time:\s*(\d+)/i)?.[1]) || undefined;
  return { title, company, mode, minutes };
}

const str = v => (typeof v === "string" ? v : "");
const titleFromTopic = topic => topic.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

function parseJsonMaybe(value) {
  if (value == null) return undefined;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return undefined; }
}

/** A document the workbench can open — the same check the cloud canvas route makes. */
export function isExcalidrawDoc(doc) {
  return !!doc && typeof doc === "object" && doc.type === "excalidraw" && Array.isArray(doc.elements);
}

/**
 * Build a bundle session entry from a session folder's files
 * (`{ "prompt.md": "…", "canvas.excalidraw": "…" | doc, … }`). Missing files are
 * simply absent; canvases/specs that aren't valid JSON are dropped.
 */
export function sessionFromFiles(name, files = {}) {
  const parts = parseSessionName(name);
  if (!parts) throw new Error(`not a session name: ${name}`);
  const entry = { name };
  for (const [key, file] of Object.entries(SESSION_MD_FILES)) entry[key] = str(files[file]);
  const hdr = parsePromptHeader(entry.promptMd);
  entry.title = hdr.title ?? titleFromTopic(parts.topic);
  const company = hdr.company ?? parts.company;
  entry.companySlug = company && company !== "generic" ? company : null;
  entry.mode = MODES.includes(hdr.mode) ? hdr.mode : "breadth";
  entry.minutes = hdr.minutes ?? 45;
  entry.status = entry.feedbackMd ? "graded" : entry.promptMd ? "active" : "draft";
  entry.canvases = {};
  for (const [kind, file] of Object.entries(CANVAS_FILES)) {
    const doc = parseJsonMaybe(files[file]);
    if (isExcalidrawDoc(doc)) entry.canvases[kind] = doc;
  }
  entry.specs = {};
  for (const [kind, file] of Object.entries(SPEC_FILES)) {
    const spec = parseJsonMaybe(files[file]);
    if (spec && typeof spec === "object") entry.specs[kind] = spec;
  }
  return entry;
}

/**
 * The inverse: a session entry → `{ filename: contents }` ready to write into a
 * session folder. Empty markdown and withheld interviewer notes produce no
 * file, so a bundle never creates blank files or clobbers a local one with "".
 */
export function sessionToFiles(entry) {
  const files = {};
  for (const [key, file] of Object.entries(SESSION_MD_FILES)) {
    const md = entry[key];
    if (typeof md === "string" && md.trim()) files[file] = md.endsWith("\n") ? md : md + "\n";
  }
  for (const [kind, file] of Object.entries(CANVAS_FILES)) {
    const doc = entry.canvases?.[kind];
    if (isExcalidrawDoc(doc)) files[file] = JSON.stringify(doc, null, 2) + "\n";
  }
  for (const [kind, file] of Object.entries(SPEC_FILES)) {
    const spec = entry.specs?.[kind];
    if (spec && typeof spec === "object") files[file] = JSON.stringify(spec, null, 2) + "\n";
  }
  return files;
}

// ── progress.md ──────────────────────────────────────────────────────────────

export const PROGRESS_HEADER = [
  "# Progress log",
  "",
  "One row per graded session. Overall = rubric average (1–5). Mode = mock | async.",
  "",
  "| Date | Company | Topic | Mode | Overall | Weakest dimension | Session |",
  "|------|---------|-------|------|---------|-------------------|---------|",
].join("\n");

const cells = line => line.split("|").slice(1, -1).map(s => s.trim());

/** The table in progress.md → rows keyed by session name. Unparseable lines are ignored. */
export function parseProgressMd(md) {
  const rows = [];
  for (const line of str(md).split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    if (c.length < 7 || c[0] === "Date" || /^-+$/.test(c[0])) continue;
    const sessionName = c[6].replace(/^sessions\//, "").replace(/\/$/, "");
    if (!isSessionName(sessionName)) continue;
    const overall = Number(c[4]);
    if (!Number.isFinite(overall)) continue;
    rows.push({
      sessionName,
      overall,
      weakest: c[5] || null,
      summary: null,
      gradedVia: c[3] === "async" ? "async" : c[3] === "mock" ? "mock" : null,
    });
  }
  return rows;
}

export function formatProgressRow(row) {
  const parts = parseSessionName(row.sessionName) ?? { date: "", company: "", topic: "" };
  const esc = v => str(v == null ? "" : String(v)).replace(/\|/g, "/").replace(/\n/g, " ");
  return `| ${parts.date} | ${parts.company} | ${parts.topic} | ${row.gradedVia ?? "mock"} | ${Number(row.overall).toFixed(1)} | ${esc(row.weakest)} | sessions/${row.sessionName} |`;
}

/**
 * Merge rows into progress.md: a row whose session already has a line replaces
 * that line in place, new rows are appended, everything else is untouched.
 */
export function upsertProgressMd(md, rows) {
  let text = str(md).trim() ? str(md).replace(/\s+$/, "") : PROGRESS_HEADER;
  const lines = text.split("\n");
  const pending = [...rows];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("|")) continue;
    const c = cells(lines[i]);
    if (c.length < 7) continue;
    const name = c[6].replace(/^sessions\//, "").replace(/\/$/, "");
    const idx = pending.findIndex(r => r.sessionName === name);
    if (idx === -1) continue;
    lines[i] = formatProgressRow(pending[idx]);
    pending.splice(idx, 1);
  }
  const out = [...lines, ...pending.map(formatProgressRow)];
  return out.join("\n") + "\n";
}

// ── fingerprints ─────────────────────────────────────────────────────────────

function stable(value) {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

/** FNV-1a (32-bit, hex) — enough to tell "same content" from "changed", zero deps. */
export function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Content identity of a session: the markdown, the diagrams and the specs —
 * not timestamps, ids or status, which legitimately differ between sides.
 */
export function fingerprintSession(entry) {
  const md = {};
  // Files end in a newline, DB columns usually don't; neither is a content change.
  for (const key of Object.keys(SESSION_MD_FILES)) md[key] = str(entry[key]).replace(/\r\n/g, "\n").replace(/\s+$/, "");
  return fnv1a(stable({ md, canvases: entry.canvases ?? {}, specs: entry.specs ?? {} }));
}

export function fingerprintProgress(row) {
  return fnv1a(stable({ overall: Number(row.overall), weakest: row.weakest ?? null, summary: row.summary ?? null }));
}

// ── bundle construction & validation ─────────────────────────────────────────

export function createBundle({ sessions = [], progress = [], source = "oss", exportedAt } = {}) {
  return {
    format: BUNDLE_FORMAT,
    exportedAt: exportedAt ?? new Date().toISOString(),
    source,
    sessions,
    progress,
  };
}

/**
 * Accept anything a drawthesystem side has ever written and return a clean
 * `{ sessions, progress }` plus warnings for what was dropped. Throws only when
 * the input isn't a bundle at all.
 */
export function normalizeBundle(raw) {
  if (!raw || typeof raw !== "object") throw new Error("not a bundle: expected a JSON object");
  if (typeof raw.format !== "string" || !raw.format.startsWith("drawthesystem.")) {
    throw new Error(`not a bundle: unknown format ${JSON.stringify(raw.format)}`);
  }
  if (!Array.isArray(raw.sessions)) throw new Error("not a bundle: missing sessions[]");
  const warnings = [];
  const sessions = [];
  const nameById = new Map();
  const seen = new Set();
  for (const s of raw.sessions) {
    if (!s || typeof s !== "object" || !isSessionName(s.name)) {
      warnings.push(`skipped a session with an invalid name: ${JSON.stringify(s?.name)}`);
      continue;
    }
    if (seen.has(s.name)) { warnings.push(`duplicate session ${s.name} — kept the first`); continue; }
    seen.add(s.name);
    const parts = parseSessionName(s.name);
    const entry = { name: s.name };
    for (const key of Object.keys(SESSION_MD_FILES)) entry[key] = key === "interviewerMd" && s[key] == null ? null : str(s[key]);
    entry.title = str(s.title).trim() || parsePromptHeader(entry.promptMd).title || titleFromTopic(parts.topic);
    entry.companySlug = typeof s.companySlug === "string" && s.companySlug && s.companySlug !== "generic" ? s.companySlug : null;
    entry.mode = MODES.includes(s.mode) ? s.mode : "breadth";
    entry.minutes = Number.isInteger(s.minutes) && s.minutes > 0 ? s.minutes : 45;
    entry.status = STATUSES.includes(s.status) ? s.status : entry.feedbackMd ? "graded" : entry.promptMd ? "active" : "draft";
    entry.canvases = {};
    for (const kind of Object.keys(CANVAS_FILES)) {
      const doc = parseJsonMaybe(s.canvases?.[kind]);
      if (doc === undefined) continue;
      if (isExcalidrawDoc(doc)) entry.canvases[kind] = doc;
      else warnings.push(`${s.name}: ${CANVAS_FILES[kind]} is not an Excalidraw document — dropped`);
    }
    entry.specs = {};
    for (const kind of Object.keys(SPEC_FILES)) {
      const spec = parseJsonMaybe(s.specs?.[kind]);
      if (spec && typeof spec === "object") entry.specs[kind] = spec;
    }
    if (typeof s.createdAt === "string" || typeof s.createdAt === "number") entry.createdAt = s.createdAt;
    if (typeof s.updatedAt === "string" || typeof s.updatedAt === "number") entry.updatedAt = s.updatedAt;
    if (typeof s.id === "string") nameById.set(s.id, s.name);
    sessions.push(entry);
  }
  const progress = [];
  const progressSeen = new Set();
  for (const p of Array.isArray(raw.progress) ? raw.progress : []) {
    if (!p || typeof p !== "object") continue;
    const sessionName = isSessionName(p.sessionName) ? p.sessionName : nameById.get(p.sessionId);
    const overall = Number(p.overall);
    if (!sessionName) { warnings.push(`skipped a progress row with no session: ${JSON.stringify(p.sessionName ?? p.sessionId)}`); continue; }
    if (!Number.isFinite(overall)) { warnings.push(`skipped the progress row for ${sessionName}: overall is not a number`); continue; }
    if (progressSeen.has(sessionName)) continue;
    progressSeen.add(sessionName);
    progress.push({
      sessionName,
      overall,
      weakest: str(p.weakest) || null,
      summary: str(p.summary) || null,
      gradedVia: p.gradedVia === "async" ? "async" : p.gradedVia === "mock" ? "mock" : null,
    });
  }
  return { format: raw.format, source: typeof raw.source === "string" ? raw.source : undefined, sessions, progress, warnings };
}

// ── import planning ──────────────────────────────────────────────────────────

/**
 * Compare a (normalized) bundle with what the destination already holds:
 *   existing.sessions: [{ name, fingerprint }]
 *   existing.progress: [{ sessionName, fingerprint }]
 * Every bundle item gets an `action`: new | identical | conflict.
 */
export function planImport(bundle, existing = {}) {
  const have = new Map((existing.sessions ?? []).map(s => [s.name, s.fingerprint]));
  const haveProgress = new Map((existing.progress ?? []).map(p => [p.sessionName, p.fingerprint]));
  const sessions = bundle.sessions.map(s => {
    const fingerprint = fingerprintSession(s);
    const action = !have.has(s.name) ? "new" : have.get(s.name) === fingerprint ? "identical" : "conflict";
    return {
      name: s.name,
      title: s.title,
      status: s.status,
      fingerprint,
      action,
      files: Object.keys(sessionToFiles(s)),
      interviewerWithheld: s.interviewerMd === null,
    };
  });
  const inBundle = new Set(bundle.sessions.map(s => s.name));
  const progress = bundle.progress.map(p => {
    const fingerprint = fingerprintProgress(p);
    let action;
    if (!inBundle.has(p.sessionName) && !have.has(p.sessionName)) action = "orphan";
    else if (!haveProgress.has(p.sessionName)) action = "new";
    else action = haveProgress.get(p.sessionName) === fingerprint ? "identical" : "conflict";
    return { sessionName: p.sessionName, overall: p.overall, weakest: p.weakest, fingerprint, action };
  });
  const count = (items, action) => items.filter(i => i.action === action).length;
  return {
    sessions,
    progress,
    existingNames: [...have.keys()],
    summary: {
      sessions: { new: count(sessions, "new"), identical: count(sessions, "identical"), conflict: count(sessions, "conflict") },
      progress: { new: count(progress, "new"), identical: count(progress, "identical"), conflict: count(progress, "conflict"), orphan: count(progress, "orphan") },
    },
    warnings: bundle.warnings ?? [],
  };
}

/** `name-2`, `name-3`, … — the first not in `taken`. */
export function copyName(name, taken) {
  const has = n => (taken instanceof Set ? taken.has(n) : taken.includes(n));
  for (let i = 2; ; i++) {
    const candidate = `${name}-${i}`;
    if (!has(candidate)) return candidate;
  }
}

/**
 * Turn a plan plus the user's per-item decisions into concrete actions.
 *   decisions: { [sessionName]: "skip" | "replace" | "copy" } for conflicts;
 *   onConflict: the default for conflicts with no decision.
 * Progress rows follow their session: a session that is created or replaced
 * carries its score along; one the user skipped keeps the destination's score.
 * Identical sessions still receive a new/changed score (the score is the one
 * thing that can legitimately differ for the same content).
 */
export function resolveImport(plan, bundle, decisions = {}, { onConflict = "skip" } = {}) {
  if (!CONFLICT_CHOICES.includes(onConflict)) throw new Error(`onConflict must be one of ${CONFLICT_CHOICES.join("|")}`);
  const byName = new Map(bundle.sessions.map(s => [s.name, s]));
  const taken = new Set([...plan.sessions.map(s => s.name), ...(plan.existingNames ?? [])]);
  const sessions = [];
  const target = new Map(); // source name → destination name (or null when skipped)
  for (const item of plan.sessions) {
    const session = byName.get(item.name);
    if (item.action === "new") {
      sessions.push({ kind: "create", name: item.name, targetName: item.name, reason: "new", session });
      target.set(item.name, item.name);
      continue;
    }
    if (item.action === "identical") {
      sessions.push({ kind: "skip", name: item.name, targetName: item.name, reason: "identical", session });
      target.set(item.name, item.name);
      continue;
    }
    const choice = decisions[item.name] ?? onConflict;
    if (!CONFLICT_CHOICES.includes(choice)) throw new Error(`decision for ${item.name} must be one of ${CONFLICT_CHOICES.join("|")}`);
    if (choice === "skip") {
      sessions.push({ kind: "skip", name: item.name, targetName: item.name, reason: "skipped", session });
      target.set(item.name, null);
    } else if (choice === "replace") {
      sessions.push({ kind: "replace", name: item.name, targetName: item.name, reason: "replace", session });
      target.set(item.name, item.name);
    } else {
      const name = copyName(item.name, taken);
      taken.add(name);
      sessions.push({ kind: "create", name: item.name, targetName: name, reason: "copy", session: { ...session, name } });
      target.set(item.name, name);
    }
  }
  const progress = [];
  const byProgress = new Map(bundle.progress.map(p => [p.sessionName, p]));
  for (const item of plan.progress) {
    const row = byProgress.get(item.sessionName);
    if (item.action === "orphan") { progress.push({ kind: "skip", sessionName: item.sessionName, reason: "no such session", row }); continue; }
    const dest = target.has(item.sessionName) ? target.get(item.sessionName) : item.sessionName;
    if (dest === null) { progress.push({ kind: "skip", sessionName: item.sessionName, reason: "session skipped", row }); continue; }
    // A copy is a new session: it gets its score even when the original's is identical.
    if (dest === item.sessionName && item.action === "identical") { progress.push({ kind: "skip", sessionName: item.sessionName, reason: "identical", row }); continue; }
    progress.push({ kind: "upsert", sessionName: dest, reason: dest === item.sessionName ? item.action : "copy", row: { ...row, sessionName: dest } });
  }
  return { sessions, progress, summary: summarizeActions({ sessions, progress }) };
}

export function summarizeActions({ sessions, progress }) {
  const n = (items, kind) => items.filter(i => i.kind === kind).length;
  return {
    created: n(sessions, "create"),
    replaced: n(sessions, "replace"),
    skipped: n(sessions, "skip"),
    progressUpserted: n(progress, "upsert"),
    progressSkipped: n(progress, "skip"),
  };
}

/** A markdown preview of a plan — what the CLI prints and what an agent shows the user. */
export function renderPlan(plan) {
  const lines = [];
  const mark = { new: "new", identical: "identical — skip", conflict: "CONFLICT", orphan: "orphan — skip" };
  lines.push("| Session | Status | Files | Import |");
  lines.push("|---------|--------|-------|--------|");
  for (const s of plan.sessions) {
    const files = s.files.length ? s.files.join(", ") : "(empty)";
    const withheld = s.interviewerWithheld ? " (interviewer.md withheld)" : "";
    lines.push(`| ${s.name} | ${s.status} | ${files}${withheld} | ${mark[s.action]} |`);
  }
  if (!plan.sessions.length) lines.push("| (no sessions) | | | |");
  if (plan.progress.length) {
    lines.push("");
    lines.push("| Progress for | Overall | Weakest | Import |");
    lines.push("|--------------|---------|---------|--------|");
    for (const p of plan.progress) lines.push(`| ${p.sessionName} | ${Number(p.overall).toFixed(1)} | ${p.weakest ?? ""} | ${mark[p.action]} |`);
  }
  const s = plan.summary;
  lines.push("");
  lines.push(`Sessions: ${s.sessions.new} new · ${s.sessions.identical} identical · ${s.sessions.conflict} conflict` +
    ` — progress rows: ${s.progress.new} new · ${s.progress.identical} identical · ${s.progress.conflict} conflict` +
    (s.progress.orphan ? ` · ${s.progress.orphan} orphan` : ""));
  for (const w of plan.warnings ?? []) lines.push(`⚠ ${w}`);
  return lines.join("\n");
}
