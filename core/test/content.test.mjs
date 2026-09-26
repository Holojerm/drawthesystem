// Runs under `node --test core/test` and `bun test core/test` — no framework.
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildContent, parseProblemMarkdown } from "../content/parse.mjs";
import { loadContent } from "../content/node.mjs";

const PROMPT = `# Design a URL shortener
_Company: generic · Mode: depth · Time: 60 min · Level: senior/staff_

## Setting
A link company needs redirects.

## The ask
Design the redirect path.

## Given constraints
- 1B redirects/month
- p99 < 50ms

## Deliverables (what a strong answer covers)
Requirements, estimates, API, diagram, deep dive, trade-offs.

## Rules
Think aloud.
`;

test("parseProblemMarkdown reads the candidate-facing header and sections", () => {
  const problem = parseProblemMarkdown(PROMPT, { slug: "url-shortener" });
  assert.equal(problem.slug, "url-shortener");
  assert.equal(problem.title, "Design a URL shortener");
  assert.equal(problem.mode, "depth");
  assert.equal(problem.minutes, 60);
  assert.equal(problem.level, "senior/staff");
  assert.equal(problem.setting, "A link company needs redirects.");
  assert.equal(problem.ask, "Design the redirect path.");
  assert.deepEqual(problem.constraints, ["1B redirects/month", "p99 < 50ms"]);
  assert.match(problem.deliverables, /^Requirements, estimates/);
  assert.equal(problem.markdown, PROMPT);
  assert.ok(!("company" in problem), "problems/ entries carry no company field");
});

test("parseProblemMarkdown rejects a non-generic Company field", () => {
  const acme = PROMPT.replace("Company: generic", "Company: acme");
  assert.throws(() => parseProblemMarkdown(acme, { slug: "x" }), /must be Company: generic/);
});

test("parseProblemMarkdown defaults mode to breadth and throws on missing sections", () => {
  const breadthPrompt = PROMPT.replace("Mode: depth", "Mode: breadth");
  assert.equal(parseProblemMarkdown(breadthPrompt, { slug: "x" }).mode, "breadth");

  const noAsk = PROMPT.replace("## The ask\nDesign the redirect path.\n\n", "");
  assert.throws(() => parseProblemMarkdown(noAsk, { slug: "x" }), /missing "## The ask" section/);

  assert.throws(() => parseProblemMarkdown("# No header\n", { slug: "x" }), /missing "_Company/);
});

test("buildContent sorts problems by slug and never sees interviewer.md", () => {
  const content = buildContent({
    skillMarkdowns: {},
    rubricMarkdown: "intro\n\n| # | Dimension | Weak | Solid | Staff+ |\n|---|---|---|---|---|\n".concat(
      Array.from({ length: 10 }, (_, i) => `| ${i + 1} | D${i + 1} | w | s | p |`).join("\n"),
      "\n\n## Diagram-specific checks\n- a\n\n## Common senior-level failure modes\n- b\n",
    ),
    problemMarkdowns: {
      zeta: PROMPT,
      alpha: PROMPT,
    },
  });
  assert.deepEqual(content.problems.map(p => p.slug), ["alpha", "zeta"]);
  assert.equal(content.problemsBySlug.alpha.title, "Design a URL shortener");
  assert.ok(!("interviewerMd" in content.problemsBySlug.alpha));
});

test("loadContent scans problems/ off disk and finds the real, generic-only catalogue", () => {
  const content = loadContent();
  assert.ok(content.problems.length >= 15, `expected 15+ problems, found ${content.problems.length}`);
  assert.ok(content.problemsBySlug["url-shortener"], "url-shortener should be scanned");
  // Every real problem parses (parseProblemMarkdown already rejects a
  // non-generic Company field), so nothing here can be company-flavoured.
  for (const problem of content.problems) {
    assert.ok(!("company" in problem));
  }
});
