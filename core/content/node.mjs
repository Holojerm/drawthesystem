/**
 * node.mjs — Node/Bun loader for the skill/rubric content.
 *
 * Reads the same source files as ./index.mjs but with fs (Workers can't), so
 * repo tooling and CI can validate the content without a bundler. Scans
 * skills/ dynamically — a new skill is picked up here with no changes (the
 * bundler entry ./index.mjs still needs its one import line).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { buildContent } from "./parse.mjs";

export function loadContent(rootDir = fileURLToPath(new URL("../..", import.meta.url))) {
  const skillMarkdowns = {};
  const references = {};
  const skillsDir = join(rootDir, "skills");
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    skillMarkdowns[entry.name] = readFileSync(skillPath, "utf8");
    const refsDir = join(skillsDir, entry.name, "references");
    if (existsSync(refsDir)) {
      references[entry.name] = Object.fromEntries(
        readdirSync(refsDir)
          .filter(f => f.endsWith(".md"))
          .map(f => [`references/${f}`, readFileSync(join(refsDir, f), "utf8")]),
      );
    }
  }
  return buildContent({
    skillMarkdowns,
    references,
    rubricMarkdown: readFileSync(join(rootDir, "rubric", "rubric.md"), "utf8"),
  });
}
