import type { Bundle, BundleProgress, BundleSession, ExistingState, ImportActions, SessionFiles } from "./bundle.js";

export declare function readSessionDir(dir: string): SessionFiles;
export declare function listSessionNames(root: string): string[];
export declare function readProgress(root: string): BundleProgress[];
export declare function readRepoBundle(root: string, options?: { only?: string[]; source?: string }): Bundle;
export declare function readRepoState(root: string): Required<ExistingState>;
export declare function writeSessionDir(root: string, entry: BundleSession): string[];
export declare function applyRepoActions(
  root: string,
  actions: ImportActions,
): { sessions: { name: string; kind: "create" | "replace"; files: string[] }[]; progressRows: number };
