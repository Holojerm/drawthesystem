export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const files: Record<string, string | null> = {};
  for (const f of SESSION_FILES) if (f !== "interviewer.md") files[f] = await readText("sessions", id, f);
  const all = await listSessions();
  const summary = all.find(s => s.id === id);
  if (!summary) throw createError({ statusCode: 404, statusMessage: "session not found" });
  return { ...summary, files, canvasMtime: await mtime("sessions", id, "canvas.excalidraw"), solutionMtime: await mtime("sessions", id, "solution.excalidraw") };
});
