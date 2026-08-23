#!/usr/bin/env bun
/**
 * bundle.mjs — move practice work between this checkout and Draw the System
 * cloud (or another checkout) as one JSON file. Same format in both directions
 * (the cloud's account export — see core/src/bundle.mjs for the schema).
 *
 *   bun scripts/bundle.mjs export [out.json] [--only <session>,<session>]
 *       Pack sessions/ + progress.md. Default name: drawthesystem-export-YYYY-MM-DD.json.
 *       Upload it on the cloud's Account page (Import), or hand it to another checkout.
 *
 *   bun scripts/bundle.mjs import <file.json> [--dry-run] [--on-conflict skip|replace|copy] [--decide <session>=<choice>,…]
 *       Unpack into sessions/ and progress.md. Always prints the plan first
 *       (new / identical / conflict per item); --dry-run stops there. A
 *       conflict — a session with the same name but different content — is
 *       skipped unless you say otherwise, per item (--decide) or for all
 *       (--on-conflict). `copy` imports it as <name>-2. Nothing is ever deleted.
 *
 * Thin CLI over core/src/bundle.mjs + core/src/bundle-node.mjs (zero deps, Node ≥ 20).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeBundle, planImport, renderPlan, resolveImport } from "../core/src/bundle.mjs";
import { applyRepoActions, readRepoBundle, readRepoState } from "../core/src/bundle-node.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const [, , cmd, ...rest] = process.argv;

function flag(name) {
  const i = rest.indexOf(name);
  if (i === -1) return undefined;
  const v = rest[i + 1];
  rest.splice(i, v === undefined || v.startsWith("--") ? 1 : 2);
  return v === undefined || v.startsWith("--") ? true : v;
}

const usage = () => {
  console.error("usage: bundle.mjs export [out.json] [--only a,b]\n       bundle.mjs import <file.json> [--dry-run] [--on-conflict skip|replace|copy] [--decide name=choice,...]");
  process.exit(1);
};

if (cmd === "export") {
  const only = flag("--only")?.split(",").map(s => s.trim()).filter(Boolean);
  const out = resolve(rest[0] ?? `drawthesystem-export-${new Date().toISOString().slice(0, 10)}.json`);
  const bundle = readRepoBundle(ROOT, { only });
  writeFileSync(out, JSON.stringify(bundle, null, 2) + "\n");
  console.log(`wrote ${out}`);
  console.log(`${bundle.sessions.length} session(s), ${bundle.progress.length} progress row(s)`);
  for (const s of bundle.sessions) console.log(`  ${s.name} · ${s.status}${s.interviewerMd ? "" : " · no interviewer.md"}`);
  console.log("Next: cloud → Account → Import; another checkout → bun scripts/bundle.mjs import <file>");
} else if (cmd === "import") {
  const dryRun = flag("--dry-run") === true;
  const onConflict = flag("--on-conflict") ?? "skip";
  const decisions = Object.fromEntries(
    (flag("--decide") ?? "").split(",").map(s => s.trim()).filter(Boolean).map(pair => {
      const [name, choice] = pair.split("=");
      if (!name || !choice) usage();
      return [name, choice];
    }),
  );
  const file = rest[0];
  if (!file) usage();
  let raw;
  try { raw = JSON.parse(readFileSync(resolve(file), "utf8")); } catch (e) { console.error(`cannot read ${file}: ${e.message}`); process.exit(1); }
  const bundle = normalizeBundle(raw);
  const plan = planImport(bundle, readRepoState(ROOT));
  console.log(renderPlan(plan));
  if (dryRun) {
    if (plan.summary.sessions.conflict) console.log("\nConflicts are skipped by default. Re-run with --decide <session>=replace|copy|skip,… or --on-conflict replace|copy.");
    process.exit(0);
  }
  const actions = resolveImport(plan, bundle, decisions, { onConflict });
  const result = applyRepoActions(ROOT, actions);
  console.log("");
  for (const s of result.sessions) console.log(`${s.kind === "replace" ? "replaced" : "created"} sessions/${s.name} (${s.files.join(", ")})`);
  for (const a of actions.sessions.filter(a => a.kind === "skip" && a.reason === "skipped")) console.log(`skipped ${a.name} (conflict)`);
  const sum = actions.summary;
  console.log(`\n${sum.created} created · ${sum.replaced} replaced · ${sum.skipped} skipped · ${result.progressRows} progress row(s) merged into progress.md`);
} else {
  usage();
}
