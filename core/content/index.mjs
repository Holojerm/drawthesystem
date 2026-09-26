/**
 * index.mjs — bundler entry for the skill/rubric/problem content.
 *
 * Statically imports the markdown SOURCE files from skills/, rubric/, and
 * problems/ — nothing is copied or generated, so an edit to those files lands
 * in the next consumer build automatically. Requires an ".md as text" rule in
 * the consumer's bundler (see core/README.md); in plain Node use ./node.mjs.
 *
 * Adding or renaming a skill or a problem: update the import list below (and
 * nothing else). Problems come from problems/<slug>/prompt.md — a
 * deliberately public, version-controlled directory of generic practice
 * problems — NEVER from sessions/<date>-<company>-<topic>/prompt.md or
 * companies/<slug>/profile.md, which are gitignored fork-local personal
 * practice data (someone's own interview targets and history) and must never
 * be imported here, even by a local checkout that happens to have them on
 * disk.
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

import chatSystemMd from "../../problems/chat-system/prompt.md";
import collaborativeEditorMd from "../../problems/collaborative-editor/prompt.md";
import distributedCacheMd from "../../problems/distributed-cache/prompt.md";
import fileSyncMd from "../../problems/file-sync/prompt.md";
import keyValueStoreMd from "../../problems/key-value-store/prompt.md";
import metricsMonitoringMd from "../../problems/metrics-monitoring/prompt.md";
import newsFeedMd from "../../problems/news-feed/prompt.md";
import notificationSystemMd from "../../problems/notification-system/prompt.md";
import paymentLedgerMd from "../../problems/payment-ledger/prompt.md";
import rateLimiterMd from "../../problems/rate-limiter/prompt.md";
import rideHailingDispatchMd from "../../problems/ride-hailing-dispatch/prompt.md";
import searchAutocompleteMd from "../../problems/search-autocomplete/prompt.md";
import urlShortenerMd from "../../problems/url-shortener/prompt.md";
import videoStreamingMd from "../../problems/video-streaming/prompt.md";
import webCrawlerMd from "../../problems/web-crawler/prompt.md";

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
    "chat-system": chatSystemMd,
    "collaborative-editor": collaborativeEditorMd,
    "distributed-cache": distributedCacheMd,
    "file-sync": fileSyncMd,
    "key-value-store": keyValueStoreMd,
    "metrics-monitoring": metricsMonitoringMd,
    "news-feed": newsFeedMd,
    "notification-system": notificationSystemMd,
    "payment-ledger": paymentLedgerMd,
    "rate-limiter": rateLimiterMd,
    "ride-hailing-dispatch": rideHailingDispatchMd,
    "search-autocomplete": searchAutocompleteMd,
    "url-shortener": urlShortenerMd,
    "video-streaming": videoStreamingMd,
    "web-crawler": webCrawlerMd,
  },
});

export const { skills, skillsByName, rubricMarkdown, rubric, problems, problemsBySlug } = content;
