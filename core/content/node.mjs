/**
 * node.mjs — Node/Bun loader for the skill/rubric/problem content.
 *
 * Reads the same source files as ./index.mjs but with fs (Workers can't), so
 * repo tooling and CI can validate the content without a bundler. Scans
 * skills/ and problems/ dynamically — a new skill or problem is picked up
 * here with no changes (the bundler entry ./index.mjs still needs its one
 * import line each).
 *
 * problems/, never sessions/ or companies/: those two are gitignored,
 * fork-local personal practice data (someone's own interview targets and
 * history — see .gitignore and the cloud repo's
 * server/db/seed/company-profiles.sql, which says the same about companies/).
 * problems/ is a separate, deliberately public and version-controlled
 * directory of generic practice problems, safe to publish as product content.
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

  const problemMarkdowns = {};
  const problemsDir = join(rootDir, "problems");
  for (const entry of readdirSync(problemsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const promptPath = join(problemsDir, entry.name, "prompt.md");
    if (!existsSync(promptPath)) continue;
    problemMarkdowns[entry.name] = readFileSync(promptPath, "utf8");
  }

  return buildContent({
    skillMarkdowns,
    references,
    rubricMarkdown: readFileSync(join(rootDir, "rubric", "rubric.md"), "utf8"),
    problemMarkdowns,
  });
}
