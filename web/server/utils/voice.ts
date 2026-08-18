/**
 * In-memory voice bridge state, shared by /api/voice/* routes.
 * Mirrors scripts/voice.mjs `serve` so the CLI (`voice.mjs speak|listen`) works
 * against the web app unchanged.
 */
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

type Waiter = (text: string | null) => void;

interface VoiceState {
  outbox: string[];
  inbox: string[];
  waiters: Waiter[];
  lastSeen: number;
  transcript: { who: "Interviewer" | "Candidate"; text: string; at: number }[];
  session: string | null; // session id the transcript should also be appended to
}

const g = globalThis as unknown as { __voice?: VoiceState };
export const voice: VoiceState = g.__voice ??= { outbox: [], inbox: [], waiters: [], lastSeen: 0, transcript: [], session: null };

export async function logLine(who: "Interviewer" | "Candidate", text: string) {
  voice.transcript.push({ who, text, at: Date.now() });
  const target = voice.session ? safePath("sessions", voice.session, "transcript.md") : safePath("sessions", ".voice-transcript.md");
  await mkdir(dirname(target), { recursive: true });
  await appendFile(target, `**${who}:** ${text}\n\n`, "utf8");
}

export function deliverUtterance(text: string) {
  const w = voice.waiters.shift();
  if (w) w(text); else voice.inbox.push(text);
}

export function waitForUtterance(maxMs: number): Promise<string | null> {
  if (voice.inbox.length) return Promise.resolve(voice.inbox.splice(0).join(" "));
  return new Promise(resolve => {
    let done = false;
    const finish: Waiter = t => { if (done) return; done = true; resolve(t); };
    voice.waiters.push(finish);
    setTimeout(() => { if (!done) { voice.waiters = voice.waiters.filter(w => w !== finish); finish(null); } }, maxMs);
  });
}
