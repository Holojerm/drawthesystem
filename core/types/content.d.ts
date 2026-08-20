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

export interface Content {
  /** Sorted by name. */
  skills: SkillContent[];
  skillsByName: Record<string, SkillContent>;
  /** Raw rubric/rubric.md — the ground truth. */
  rubricMarkdown: string;
  rubric: Rubric;
}

export declare const skills: SkillContent[];
export declare const skillsByName: Record<string, SkillContent>;
export declare const rubricMarkdown: string;
export declare const rubric: Rubric;
