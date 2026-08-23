import type { ExcalidrawDocument, ExcalidrawSpec } from "./excalidraw.js";

export declare const BUNDLE_FORMAT: "drawthesystem.account-export.v1";
export declare const SESSION_MD_FILES: {
  promptMd: "prompt.md";
  interviewerMd: "interviewer.md";
  notesMd: "notes.md";
  feedbackMd: "feedback.md";
  solutionMd: "solution.md";
  transcriptMd: "transcript.md";
};
export declare const CANVAS_FILES: {
  canvas: "canvas.excalidraw";
  solution: "solution.excalidraw";
  solution45: "solution-45min.excalidraw";
};
export declare const SPEC_FILES: {
  canvas: "canvas-spec.json";
  solution: "solution-spec.json";
  solution45: "solution-45min-spec.json";
};
export declare const MODES: readonly SessionMode[];
export declare const STATUSES: readonly SessionStatus[];
export declare const CONFLICT_CHOICES: readonly ConflictChoice[];
export declare const PROGRESS_HEADER: string;

export type SessionMode = "breadth" | "depth";
export type SessionStatus = "draft" | "active" | "graded";
export type CanvasKind = keyof typeof CANVAS_FILES;
export type ConflictChoice = "skip" | "replace" | "copy";
export type PlanAction = "new" | "identical" | "conflict";
export type ProgressPlanAction = PlanAction | "orphan";

/** One session in a bundle — the OSS session folder as an object. */
export interface BundleSession {
  /** `YYYY-MM-DD-<company>-<topic>`; the session's identity on both sides. */
  name: string;
  title: string;
  companySlug: string | null;
  mode: SessionMode;
  minutes: number;
  status: SessionStatus;
  promptMd: string;
  /** null when the exporter withheld the hidden answer key. */
  interviewerMd: string | null;
  notesMd: string;
  feedbackMd: string;
  solutionMd: string;
  transcriptMd: string;
  canvases: Partial<Record<CanvasKind, ExcalidrawDocument>>;
  specs: Partial<Record<CanvasKind, ExcalidrawSpec>>;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface BundleProgress {
  sessionName: string;
  /** 1–5 rubric average. */
  overall: number;
  weakest: string | null;
  summary: string | null;
  gradedVia: "mock" | "async" | null;
}

export interface Bundle {
  format: string;
  exportedAt: string;
  source?: string;
  sessions: BundleSession[];
  progress: BundleProgress[];
}

export interface NormalizedBundle {
  format: string;
  source?: string;
  sessions: BundleSession[];
  progress: BundleProgress[];
  /** What normalizeBundle() dropped, in plain words. */
  warnings: string[];
}

export interface PromptHeader {
  title?: string;
  company?: string;
  mode?: string;
  minutes?: number;
}

/** `{ filename: contents }` — canvases/specs may be JSON text or already-parsed objects. */
export type SessionFiles = Record<string, string | object>;

export declare function parseSessionName(name: unknown): { date: string; company: string; topic: string } | null;
export declare function isSessionName(name: unknown): name is string;
export declare function parsePromptHeader(md: unknown): PromptHeader;
export declare function isExcalidrawDoc(doc: unknown): doc is ExcalidrawDocument;
export declare function sessionFromFiles(name: string, files?: SessionFiles): BundleSession;
export declare function sessionToFiles(entry: BundleSession): Record<string, string>;

export declare function parseProgressMd(md: unknown): BundleProgress[];
export declare function formatProgressRow(row: BundleProgress): string;
export declare function upsertProgressMd(md: unknown, rows: BundleProgress[]): string;

export declare function fnv1a(text: string): string;
export declare function fingerprintSession(entry: Pick<BundleSession, "promptMd" | "interviewerMd" | "notesMd" | "feedbackMd" | "solutionMd" | "transcriptMd"> & Partial<BundleSession>): string;
export declare function fingerprintProgress(row: Pick<BundleProgress, "overall" | "weakest" | "summary">): string;

export declare function createBundle(init?: { sessions?: BundleSession[]; progress?: BundleProgress[]; source?: string; exportedAt?: string }): Bundle;
/** Throws when the input isn't a bundle at all; otherwise cleans and returns it with warnings. */
export declare function normalizeBundle(raw: unknown): NormalizedBundle;

export interface ExistingState {
  sessions?: { name: string; fingerprint: string }[];
  progress?: { sessionName: string; fingerprint: string }[];
}

export interface PlanSession {
  name: string;
  title: string;
  status: SessionStatus;
  fingerprint: string;
  action: PlanAction;
  files: string[];
  interviewerWithheld: boolean;
}

export interface PlanProgress {
  sessionName: string;
  overall: number;
  weakest: string | null;
  fingerprint: string;
  action: ProgressPlanAction;
}

export interface ImportPlan {
  sessions: PlanSession[];
  progress: PlanProgress[];
  existingNames: string[];
  summary: {
    sessions: { new: number; identical: number; conflict: number };
    progress: { new: number; identical: number; conflict: number; orphan: number };
  };
  warnings: string[];
}

export declare function planImport(bundle: NormalizedBundle | Bundle, existing?: ExistingState): ImportPlan;
export declare function copyName(name: string, taken: Set<string> | string[]): string;

export interface SessionAction {
  kind: "create" | "replace" | "skip";
  /** Name in the bundle. */
  name: string;
  /** Name at the destination (differs from `name` for copies). */
  targetName: string;
  reason: "new" | "identical" | "skipped" | "replace" | "copy";
  session: BundleSession;
}

export interface ProgressAction {
  kind: "upsert" | "skip";
  sessionName: string;
  reason: string;
  row: BundleProgress;
}

export interface ActionSummary {
  created: number;
  replaced: number;
  skipped: number;
  progressUpserted: number;
  progressSkipped: number;
}

export interface ImportActions {
  sessions: SessionAction[];
  progress: ProgressAction[];
  summary: ActionSummary;
}

export type Decisions = Record<string, ConflictChoice>;

export declare function resolveImport(
  plan: ImportPlan,
  bundle: NormalizedBundle | Bundle,
  decisions?: Decisions,
  options?: { onConflict?: ConflictChoice },
): ImportActions;
export declare function summarizeActions(actions: Pick<ImportActions, "sessions" | "progress">): ActionSummary;
export declare function renderPlan(plan: ImportPlan): string;
