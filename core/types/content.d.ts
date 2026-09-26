export interface SkillContent {
  /** Frontmatter `name` — also the skill's directory name. */
  name: string;
  /** Frontmatter `description`, ends with a "Usage — /cmd args" clause. */
  description: string;
  license: string;
  /** Markdown body (frontmatter stripped). */
  body: string;
  /** The full original SKILL.md, frontmatter included. */
  markdown: string;
  /** Companion files, keyed by path relative to the skill dir (e.g. "references/researcher.md"). */
  references: Record<string, string>;
}

export interface RubricDimension {
  n: number;
  name: string;
  weak: string;
  solid: string;
  staffPlus: string;
}

export interface Rubric {
  /** Everything before the dimensions table (bars + grading philosophy). */
  intro: string;
  dimensions: RubricDimension[];
  diagramChecks: string[];
  failureModes: string[];
}

/** A practice problem, parsed from a session's candidate-facing prompt.md. */
export interface Problem {
  /** Session directory name with its `YYYY-MM-DD-` date prefix stripped. */
  slug: string;
  title: string;
  /** Display name from the prompt header, e.g. "Kalshi" or "generic". */
  company: string;
  mode: "breadth" | "depth";
  minutes: number;
  level: string;
  setting: string;
  ask: string;
  constraints: string[];
  /** "What a strong answer covers" — deliberately not the interviewer's hidden probes. */
  deliverables: string;
  /** The full original prompt.md, for feeding a session's promptMd verbatim. */
  markdown: string;
}

export interface Content {
  /** Sorted by name. */
  skills: SkillContent[];
  skillsByName: Record<string, SkillContent>;
  /** Raw rubric/rubric.md — the ground truth. */
  rubricMarkdown: string;
  rubric: Rubric;
  /** Sorted by slug. Never includes interviewer.md — see Problem. */
  problems: Problem[];
  problemsBySlug: Record<string, Problem>;
}

export declare const skills: SkillContent[];
export declare const skillsByName: Record<string, SkillContent>;
export declare const rubricMarkdown: string;
export declare const rubric: Rubric;
export declare const problems: Problem[];
export declare const problemsBySlug: Record<string, Problem>;
