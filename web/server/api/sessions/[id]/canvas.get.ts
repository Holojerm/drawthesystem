export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const w = getQuery(event).which;
  const which = w === "solution" ? "solution.excalidraw" : w === "solution45" ? "solution-45min.excalidraw" : "canvas.excalidraw";
  const raw = await readText("sessions", id, which);
  if (!raw) return { elements: [], appState: {}, files: {}, mtime: null };
  try { const doc = JSON.parse(raw); return { elements: doc.elements ?? [], appState: doc.appState ?? {}, files: doc.files ?? {}, mtime: await mtime("sessions", id, which) }; }
  catch { throw createError({ statusCode: 500, statusMessage: `${which} is not valid JSON` }); }
});
