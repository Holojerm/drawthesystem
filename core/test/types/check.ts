// Compiled (never run) by `bun run types:core` against core/types/*.d.ts, resolved through the
// package's exports map exactly as the cloud product resolves them. Each call pins a signature;
// the @ts-expect-error lines prove a type is not silently `any`.
import { buildExcalidraw, renderSummaryMarkdown, summarizeExcalidraw } from "@drawthesystem/core";
import type { DiagramSummary, ExcalidrawDocument, ExcalidrawSpec } from "@drawthesystem/core";
import * as bundle from "@drawthesystem/core/bundle";
import * as bundleNode from "@drawthesystem/core/bundle/node";
import * as content from "@drawthesystem/core/content";
import * as contentNode from "@drawthesystem/core/content/node";
import * as excalidraw from "@drawthesystem/core/excalidraw";
import * as reader from "@drawthesystem/core/read-excalidraw";

const spec: ExcalidrawSpec = { nodes: [{ id: "a", kind: "db" }], edges: [{ from: "a", to: "a", style: "dashed" }] };
const doc: ExcalidrawDocument = buildExcalidraw(spec);
const summary: DiagramSummary = summarizeExcalidraw(doc, { file: "x" });
const md: string = renderSummaryMarkdown(summary);
const sameFn: typeof buildExcalidraw = excalidraw.buildExcalidraw;
const sameReader: typeof summarizeExcalidraw = reader.summarizeExcalidraw;

// @ts-expect-error unknown node kind
buildExcalidraw({ nodes: [{ id: "a", kind: "nope" }] });
// @ts-expect-error summary is a string-returning renderer, not a number
const notNumber: number = renderSummaryMarkdown(summary);

const b = bundle.createBundle({ sessions: [], progress: [] });
const norm = bundle.normalizeBundle(b);
const plan = bundle.planImport(norm, {});
const actions = bundle.resolveImport(plan, norm, { x: "skip" }, { onConflict: "copy" });
const text: string = bundle.renderPlan(plan);
const counts = bundle.summarizeActions(actions);
const hash: string = bundle.fingerprintSession({ promptMd: "", interviewerMd: "", notesMd: "", feedbackMd: "", solutionMd: "", transcriptMd: "" });
const parsed: { date: string; company: string; topic: string } | null = bundle.parseSessionName("2026-01-01-a-b");
const fmt: "drawthesystem.account-export.v1" = bundle.BUNDLE_FORMAT;
// @ts-expect-error onConflict only accepts a ConflictChoice
bundle.resolveImport(plan, norm, {}, { onConflict: "merge" });

const nodeBundle = bundleNode.readRepoBundle("/tmp", { only: ["x"] });
const names: string[] = bundleNode.listSessionNames("/tmp");

const all = contentNode.loadContent();
const firstSkill: string | undefined = all.skills[0]?.name;
const bySlug = content.problemsBySlug["x"];
const firstTradeoff: string | undefined = bySlug?.study?.tradeoffs[0]?.title;

export const used = [md, sameFn, sameReader, notNumber, text, counts, hash, parsed, fmt, nodeBundle, names, firstSkill, bySlug, firstTradeoff];
