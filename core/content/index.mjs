/**
 * index.mjs — bundler entry for the skill/rubric/problem content.
 *
 * Statically imports the markdown SOURCE files from skills/, rubric/, and
 * sessions/ — nothing is copied or generated, so an edit to those files lands
 * in the next consumer build automatically. Requires an ".md as text" rule in
 * the consumer's bundler (see core/README.md); in plain Node use ./node.mjs.
 *
 * Adding or renaming a skill: update the import list below (and nothing
 * else). Adding a problem: same — one import line, keyed by the session
 * directory name with its `YYYY-MM-DD-` date prefix stripped (that's the
 * slug). Only prompt.md is imported per session — never interviewer.md,
 * which is the hidden answer key and must never reach a bundler consumers
 * ship to a browser.
 */
import critiqueMd from "../../skills/critique/SKILL.md";
import exportMd from "../../skills/export/SKILL.md";
import importMd from "../../skills/import/SKILL.md";
import mockMd from "../../skills/mock/SKILL.md";
import progressMd from "../../skills/progress/SKILL.md";
import researchMd from "../../skills/research/SKILL.md";
import researcherMd from "../../skills/research/references/researcher.md";
import scenarioMd from "../../skills/scenario/SKILL.md";
import solutionMd from "../../skills/solution/SKILL.md";
import rubricMd from "../../rubric/rubric.md";

import genericUrlShortenerMd from "../../sessions/2026-08-18-generic-url-shortener/prompt.md";
import qualitateStudyPlatformMd from "../../sessions/2026-08-18-qualitate-study-platform/prompt.md";
import blackbirdCheckSettlementMd from "../../sessions/2026-08-19-blackbird-check-settlement/prompt.md";
import cladBillingMd from "../../sessions/2026-08-19-clad-billing/prompt.md";
import cortexKnowledgeAgentsMd from "../../sessions/2026-08-19-cortex-knowledge-agents/prompt.md";
import craniometrixCareNavigationMd from "../../sessions/2026-08-19-craniometrix-care-navigation/prompt.md";
import crosbyRedlineWorkspaceMd from "../../sessions/2026-08-19-crosby-redline-workspace/prompt.md";
import diodeDesignJobsMd from "../../sessions/2026-08-19-diode-design-jobs/prompt.md";
import duetPracticePlatformMd from "../../sessions/2026-08-19-duet-practice-platform/prompt.md";
import fleetlineLoadPlannerMd from "../../sessions/2026-08-19-fleetline-load-planner/prompt.md";
import funxyzDepositCheckoutMd from "../../sessions/2026-08-19-funxyz-deposit-checkout/prompt.md";
import kalshiMarketPageMd from "../../sessions/2026-08-19-kalshi-market-page/prompt.md";
import legoraTabularReviewMd from "../../sessions/2026-08-19-legora-tabular-review/prompt.md";
import maybernFundMigrationMd from "../../sessions/2026-08-19-maybern-fund-migration/prompt.md";
import meelaCompanionCallsMd from "../../sessions/2026-08-19-meela-companion-calls/prompt.md";
import normaiReviewPlatformMd from "../../sessions/2026-08-19-normai-review-platform/prompt.md";
import numericLedgerPlatformMd from "../../sessions/2026-08-19-numeric-ledger-platform/prompt.md";
import polymarketLiveMarketMd from "../../sessions/2026-08-19-polymarket-live-market/prompt.md";
import rebuildFieldEstimateMd from "../../sessions/2026-08-19-rebuild-field-estimate/prompt.md";
import rogoArtefactAgentMd from "../../sessions/2026-08-19-rogo-artefact-agent/prompt.md";
import soriaLivingModelMd from "../../sessions/2026-08-19-soria-living-model/prompt.md";
import trataConversationDeskMd from "../../sessions/2026-08-19-trata-conversation-desk/prompt.md";

import { buildContent } from "./parse.mjs";

const content = buildContent({
  skillMarkdowns: {
    critique: critiqueMd,
    export: exportMd,
    import: importMd,
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
  problemMarkdowns: {
    "generic-url-shortener": genericUrlShortenerMd,
    "qualitate-study-platform": qualitateStudyPlatformMd,
    "blackbird-check-settlement": blackbirdCheckSettlementMd,
    "clad-billing": cladBillingMd,
    "cortex-knowledge-agents": cortexKnowledgeAgentsMd,
    "craniometrix-care-navigation": craniometrixCareNavigationMd,
    "crosby-redline-workspace": crosbyRedlineWorkspaceMd,
    "diode-design-jobs": diodeDesignJobsMd,
    "duet-practice-platform": duetPracticePlatformMd,
    "fleetline-load-planner": fleetlineLoadPlannerMd,
    "funxyz-deposit-checkout": funxyzDepositCheckoutMd,
    "kalshi-market-page": kalshiMarketPageMd,
    "legora-tabular-review": legoraTabularReviewMd,
    "maybern-fund-migration": maybernFundMigrationMd,
    "meela-companion-calls": meelaCompanionCallsMd,
    "normai-review-platform": normaiReviewPlatformMd,
    "numeric-ledger-platform": numericLedgerPlatformMd,
    "polymarket-live-market": polymarketLiveMarketMd,
    "rebuild-field-estimate": rebuildFieldEstimateMd,
    "rogo-artefact-agent": rogoArtefactAgentMd,
    "soria-living-model": soriaLivingModelMd,
    "trata-conversation-desk": trataConversationDeskMd,
  },
});

export const { skills, skillsByName, rubricMarkdown, rubric, problems, problemsBySlug } = content;
