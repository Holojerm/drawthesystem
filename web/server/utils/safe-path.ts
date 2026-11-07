import { resolve, sep } from "node:path";

export class PathOutsideRootError extends Error {
  constructor() {
    super("path outside repo");
  }
}

/** Resolve `parts` under `root`, throwing if the result escapes it. Pure so it can be tested without Nuxt. */
export function resolveInside(root: string, ...parts: string[]): string {
  const r = resolve(root);
  const p = resolve(r, ...parts);
  if (p !== r && !p.startsWith(r + sep)) throw new PathOutsideRootError();
  return p;
}
