import { promises as fs } from "node:fs";
import { join, resolve, sep } from "node:path";

export const root = () => resolve(useRuntimeConfig().repoRoot as string);

/** Resolve a path inside the repo, refusing traversal outside it. */
export function safePath(...parts: string[]) {
  const r = root();
  const p = resolve(r, ...parts);
  if (p !== r && !p.startsWith(r + sep)) throw createError({ statusCode: 400, statusMessage: "path outside repo" });
  return p;
}

export async function readText(...parts: string[]) {
  try { return await fs.readFile(safePath(...parts), "utf8"); } catch { return null; }
}
export async function writeText(content: string, ...parts: string[]) {
  const p = safePath(...parts);
  await fs.mkdir(join(p, ".."), { recursive: true });
  await fs.writeFile(p, content, "utf8");
}
export async function exists(...parts: string[]) {
  try { await fs.stat(safePath(...parts)); return true; } catch { return false; }
}
export async function mtime(...parts: string[]) {
  try { return (await fs.stat(safePath(...parts))).mtimeMs; } catch { return null; }
}

const SESSION_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+)-(.+)$/;

export interface SessionSummary {
  id: string; date: string; company: string; topic: string; title: string;
  mode?: string; minutes?: number;
  hasCanvas: boolean; hasFeedback: boolean; hasSolution: boolean; hasTranscript: boolean;
  overall?: number;
}

function parsePromptHeader(md: string | null) {
  if (!md) return {};
  const title = md.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const mode = md.match(/Mode:\s*(breadth|depth)/i)?.[1]?.toLowerCase();
  const minutes = Number(md.match(/Time:\s*(\d+)/i)?.[1]) || undefined;
  return { title, mode, minutes };
}

export async function listSessions(): Promise<SessionSummary[]> {
  let dirs: string[] = [];
  try { dirs = (await fs.readdir(safePath("sessions"), { withFileTypes: true })).filter((d: any) => d.isDirectory()).map((d: any) => d.name); } catch { return []; }
  const progress = await readText("progress.md");
  const out: SessionSummary[] = [];
  for (const id of dirs) {
    const m = id.match(SESSION_RE);
    if (!m) continue;
    const [, date, company, topicSlug] = m as unknown as [string, string, string, string];
    const prompt = await readText("sessions", id, "prompt.md");
    const hdr = parsePromptHeader(prompt);
    const row = progress?.split("\n").find(l => l.includes(id));
    const overall = row ? Number(row.split("|").map(s => s.trim())[5]) || undefined : undefined;
    out.push({
      id, date, company, topic: topicSlug.replace(/-/g, " "),
      title: hdr.title ?? topicSlug.replace(/-/g, " "), mode: hdr.mode, minutes: hdr.minutes,
      hasCanvas: await exists("sessions", id, "canvas.excalidraw"),
      hasFeedback: await exists("sessions", id, "feedback.md"),
      hasSolution: await exists("sessions", id, "solution.excalidraw"),
      hasTranscript: await exists("sessions", id, "transcript.md"),
      overall,
    });
  }
  return out.sort((a, b) => b.id.localeCompare(a.id));
}

export async function listCompanies() {
  let dirs: string[] = [];
  try { dirs = (await fs.readdir(safePath("companies"), { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name); } catch { return []; }
  const out = [];
  for (const slug of dirs) {
    const md = await readText("companies", slug, "profile.md");
    if (!md) continue;
    const name = md.match(/^#\s+(.+?)\s+—/m)?.[1] ?? slug;
    const researched = md.match(/_Researched:\s*([^_]+)_/)?.[1]?.trim();
    const tldr = md.split(/^## TL;DR.*$/m)[1]?.split(/^## /m)[0]?.trim().split("\n").filter(l => l.startsWith("-")).map(l => l.replace(/^-\s*/, "")) ?? [];
    const seeds = md.split(/^## Scenario seeds.*$/m)[1]?.split(/^## /m)[0]?.trim().split("\n").filter(l => /^\s*(\d+\.|-)/.test(l)).map(l => l.replace(/^\s*(\d+\.|-)\s*/, "")) ?? [];
    out.push({ slug, name, researched, tldr, seeds });
  }
  return out;
}

export function assertSessionId(id: string) {
  if (!SESSION_RE.test(id)) throw createError({ statusCode: 400, statusMessage: "bad session id" });
  return id;
}

/** Whitelist of editable/readable text files inside a session. */
export const SESSION_FILES = ["prompt.md", "notes.md", "feedback.md", "solution.md", "transcript.md", "interviewer.md"] as const;
export const EDITABLE = new Set(["notes.md"]);
