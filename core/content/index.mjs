/**
 * index.mjs — bundler entry for the skill/rubric content.
 *
 * Statically imports the markdown SOURCE files from skills/ and rubric/ —
 * nothing is copied or generated, so an edit to those files lands in the next
 * consumer build automatically. Requires an ".md as text" rule in the
 * consumer's bundler (see core/README.md); in plain Node use ./node.mjs.
 *
 * Adding or renaming a skill: update the import list below (and nothing else).
 */
import critiqueMd from "../../skills/critique/SKILL.md";
import mockMd from "../../skills/mock/SKILL.md";
import progressMd from "../../skills/progress/SKILL.md";
import researchMd from "../../skills/research/SKILL.md";
import researcherMd from "../../skills/research/references/researcher.md";
import scenarioMd from "../../skills/scenario/SKILL.md";
import solutionMd from "../../skills/solution/SKILL.md";
import rubricMd from "../../rubric/rubric.md";

import { buildContent } from "./parse.mjs";

const content = buildContent({
  skillMarkdowns: {
    critique: critiqueMd,
    mock: mockMd,
    progress: progressMd,
    research: researchMd,
    scenario: scenarioMd,
    solution: solutionMd,
  },
  references: {
    research: { "references/researcher.md": researcherMd },
  },
  rubricMarkdown: rubricMd,
});

export const { skills, skillsByName, rubricMarkdown, rubric } = content;
