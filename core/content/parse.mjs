/**
 * parse.mjs — pure string parsers for the skill and rubric markdown.
 * Runtime-agnostic (no fs, no Node APIs): runs in Node, Bun, and Workers.
 * Throws loudly on anything it can't parse — a failed parse should break CI
 * in this repo, not a downstream build.
 */

/**
 * Parse a SKILL.md: strictly flat `key: value` YAML frontmatter between ---
 * fences, then the markdown body.
 */
export function parseSkillMarkdown(markdown, { source = "SKILL.md" } = {}) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(markdown);
  if (!m) throw new Error(`${source}: missing frontmatter fences`);
  const frontmatter = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim()) continue;
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${source}: unparseable frontmatter line: ${line}`);
    frontmatter[kv[1]] = kv[2].trim();
  }
  for (const key of ["name", "description", "license"]) {
    if (!frontmatter[key]) throw new Error(`${source}: frontmatter missing "${key}"`);
  }
  return {
    name: frontmatter.name,
    description: frontmatter.description,
    license: frontmatter.license,
    body: markdown.slice(m[0].length),
    markdown,
    references: {},
  };
}

/** Parse rubric.md into its intro, 10-dimension table, and check/failure lists. */
export function parseRubricMarkdown(markdown) {
  const lines = markdown.split("\n");
  const dimensions = [];
  let introEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    if (!cells) continue;
    if (/^\d+$/.test(cells[0])) {
      if (introEnd === lines.length) introEnd = Math.min(introEnd, i - 2); // table header + divider
      if (cells.length !== 5) throw new Error(`rubric.md: expected 5 cells in row: ${lines[i]}`);
      dimensions.push({
        n: Number(cells[0]),
        name: cells[1].replace(/\*\*/g, ""),
        weak: cells[2],
        solid: cells[3],
        staffPlus: cells[4],
      });
    }
  }
  if (dimensions.length !== 10) throw new Error(`rubric.md: expected 10 dimensions, found ${dimensions.length}`);
  return {
    intro: lines.slice(0, introEnd).join("\n").trim(),
    dimensions,
    diagramChecks: bulletsUnder(lines, "## Diagram-specific checks"),
    failureModes: bulletsUnder(lines, "## Common senior-level failure modes"),
  };
}

function splitRow(line) {
  if (!line.startsWith("|")) return null;
  const cells = line.split("|").map(c => c.trim());
  return cells.slice(1, -1); // drop the empty ends
}

function bulletsUnder(lines, heading) {
  const start = lines.findIndex(l => l.startsWith(heading));
  if (start === -1) throw new Error(`rubric.md: heading not found: ${heading}`);
  const out = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith("## "); i++) {
    if (lines[i].startsWith("- ")) out.push(lines[i].slice(2).trim());
  }
  if (!out.length) throw new Error(`rubric.md: no bullets under: ${heading}`);
  return out;
}

/**
 * Parse a session's candidate-facing prompt.md (see skills/scenario/SKILL.md
 * for the template every one of these follows) into structured problem
 * content for public consumption.
 *
 * Deliberately reads ONLY prompt.md. interviewer.md is the hidden answer key
 * (crux, probes, red flags) and must never be parsed into anything a page
 * could render — see CLAUDE.md § Conventions.
 */
export function parseProblemMarkdown(markdown, { slug, source = "prompt.md" } = {}) {
  const lines = markdown.split("\n");
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!title) throw new Error(`${source}: missing "# Title" heading`);

  const headerIndex = lines.findIndex(l => /^_.*Company:.*_\s*$/.test(l.trim()));
  if (headerIndex === -1) throw new Error(`${source}: missing "_Company: … · Mode: …_" header line`);
  const header = lines[headerIndex].trim().replace(/^_/, "").replace(/_$/, "");
  const fields = {};
  for (const part of header.split("·")) {
    const kv = /^\s*([A-Za-z]+):\s*(.+?)\s*$/.exec(part);
    if (!kv) throw new Error(`${source}: unparseable header field: "${part}"`);
    fields[kv[1].toLowerCase()] = kv[2];
  }
  if (!fields.company) throw new Error(`${source}: header missing "Company:"`);

  const sections = {};
  let current = null;
  for (const line of lines.slice(headerIndex + 1)) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) {
      current = h[1].trim();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }
  const sectionBody = name => (sections[name] ?? []).join("\n").trim();
  const bullets = text => text.split("\n").map(l => l.trim()).filter(l => l.startsWith("- ")).map(l => l.slice(2).trim());

  const settingKey = "Setting";
  const askKey = "The ask";
  const constraintsKey = "Given constraints";
  const deliverablesKey = Object.keys(sections).find(k => k.startsWith("Deliverables"));
  for (const [label, key] of [["Setting", settingKey], ["The ask", askKey], ["Given constraints", constraintsKey], ["Deliverables", deliverablesKey]]) {
    if (!key || !(key in sections)) throw new Error(`${source}: missing "## ${label}" section`);
  }

  return {
    slug,
    title,
    company: fields.company,
    mode: /depth/i.test(fields.mode ?? "") ? "depth" : "breadth",
    minutes: Number(fields.time?.match(/\d+/)?.[0]) || 45,
    level: fields.level ?? "senior/staff",
    setting: sectionBody(settingKey),
    ask: sectionBody(askKey),
    constraints: bullets(sectionBody(constraintsKey)),
    deliverables: sectionBody(deliverablesKey),
    markdown,
  };
}

/** Assemble the public content shape from raw markdown strings. */
export function buildContent({ skillMarkdowns, references = {}, rubricMarkdown, problemMarkdowns = {} }) {
  const skills = Object.entries(skillMarkdowns)
    .map(([name, md]) => {
      const skill = parseSkillMarkdown(md, { source: `skills/${name}/SKILL.md` });
      if (skill.name !== name) throw new Error(`skills/${name}: frontmatter name is "${skill.name}"`);
      skill.references = references[name] ?? {};
      return skill;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const problems = Object.entries(problemMarkdowns)
    .map(([slug, md]) => parseProblemMarkdown(md, { slug, source: `sessions/${slug}/prompt.md` }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    skills,
    skillsByName: Object.fromEntries(skills.map(s => [s.name, s])),
    rubricMarkdown,
    rubric: parseRubricMarkdown(rubricMarkdown),
    problems,
    problemsBySlug: Object.fromEntries(problems.map(p => [p.slug, p])),
  };
}
