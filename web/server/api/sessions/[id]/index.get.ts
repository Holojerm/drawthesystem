export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const files: Record<string, string | null> = {};
  for (const f of SESSION_FILES) if (f !== "interviewer.md") files[f] = await readText("sessions", id, f);
  const all = await listSessions();
  const summary = all.find(s => s.id === id);
  if (!summary) throw createError({ statusCode: 404, statusMessage: "session not found" });
  let state: { startedAt?: number | null; minutes?: number; endedAt?: number | null } | null = null;
  try { const raw = await readText("sessions", id, "state.json"); state = raw ? JSON.parse(raw) : null; } catch { state = null; }
  return { ...summary, state, files, canvasMtime: await mtime("sessions", id, "canvas.excalidraw"), solutionMtime: await mtime("sessions", id, "solution.excalidraw") };
});
