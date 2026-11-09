// Runs under `node --test core/test` and `bun test core/test` — no framework.
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildContent, parseProblemMarkdown, parseStudyMarkdown } from "../content/parse.mjs";
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

const STUDY = `# Study notes: x

## Key trade-offs
- **Counter or hash.** One tension. Two sentences.
- **Cache or fresh.** Another.
- **Sync or async.** A third.

## Common mistakes
- **Skipping the unique index.** Races.
- **Ignoring expiry.** Stale.
- **No kill path.** Abuse.
`;

test("parseStudyMarkdown reads both lists into title and text", () => {
  const study = parseStudyMarkdown(STUDY);
  assert.deepEqual(study.tradeoffs[0], { title: "Counter or hash", text: "One tension. Two sentences." });
  assert.equal(study.tradeoffs.length, 3);
  assert.equal(study.mistakes[2].title, "No kill path");
});

test("parseStudyMarkdown rejects a missing section, a bad line and a wrong count", () => {
  assert.throws(() => parseStudyMarkdown("## Key trade-offs\n"), /needs 3 to 5|missing/);
  assert.throws(() => parseStudyMarkdown(STUDY.replace("## Common mistakes", "## Other")), /missing "## Common mistakes"/);
  assert.throws(() => parseStudyMarkdown(STUDY.replace("- **Ignoring expiry.** Stale.", "- plain bullet")), /not "- \*\*Title/);
  assert.throws(() => parseStudyMarkdown(STUDY.replace(/- \*\*No kill path.*\n/, "")), /needs 3 to 5 entries, found 2/);
});

test("buildContent attaches study notes by slug and leaves null without them", () => {
  const content = buildContent({
    skillMarkdowns: {},
    rubricMarkdown: loadContent().rubricMarkdown,
    problemMarkdowns: { alpha: PROMPT, beta: PROMPT },
    studyMarkdowns: { alpha: STUDY },
  });
  assert.equal(content.problemsBySlug.alpha.study.tradeoffs.length, 3);
  assert.equal(content.problemsBySlug.beta.study, null);
});

test("every real problem has 3 to 5 trade-offs and mistakes, free of hidden-key language", () => {
  const content = loadContent();
  assert.equal(content.problems.length, 15);
  for (const p of content.problems) {
    assert.ok(p.study, `${p.slug} has no study.md`);
    for (const list of [p.study.tradeoffs, p.study.mistakes]) {
      assert.ok(list.length >= 3 && list.length <= 5, `${p.slug}: ${list.length} entries`);
      for (const e of list) {
        assert.ok(e.title.length > 3 && e.text.length > 40, `${p.slug}: thin entry "${e.title}"`);
        assert.ok(!/[\u2014\u2013]/.test(`${e.title}${e.text}`), `${p.slug}: dash in "${e.title}"`);
      }
    }
    assert.ok(!("interviewerMd" in p));
  }
});
