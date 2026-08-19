export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const body = await readBody<{ elements: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown>; baseMtime?: number | null }>(event);
  // Optimistic concurrency: refuse to clobber a file that changed on disk (agent
  // wrote it, or excalidraw.com "Save to…") since this client last loaded/saved it.
  const current = await mtime("sessions", id, "canvas.excalidraw");
  if (body.baseMtime != null && current != null && current > body.baseMtime + 5) {
    throw createError({ statusCode: 409, statusMessage: "canvas changed on disk", data: { mtime: current } });
  }
  const doc = {
    type: "excalidraw", version: 2, source: "sysdesign-prep",
    elements: (body.elements ?? []).filter((e: any) => !e?.isDeleted),
    appState: { viewBackgroundColor: (body.appState?.viewBackgroundColor as string) ?? "#ffffff", gridSize: body.appState?.gridSize ?? null },
    files: body.files ?? {},
  };
  await writeText(JSON.stringify(doc, null, 2), "sessions", id, "canvas.excalidraw");
  return { ok: true, mtime: await mtime("sessions", id, "canvas.excalidraw") };
});
