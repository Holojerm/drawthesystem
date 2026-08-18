export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const body = await readBody<{ elements: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> }>(event);
  const doc = {
    type: "excalidraw", version: 2, source: "sysdesign-prep",
    elements: (body.elements ?? []).filter((e: any) => !e?.isDeleted),
    appState: { viewBackgroundColor: (body.appState?.viewBackgroundColor as string) ?? "#ffffff", gridSize: body.appState?.gridSize ?? null },
    files: body.files ?? {},
  };
  await writeText(JSON.stringify(doc, null, 2), "sessions", id, "canvas.excalidraw");
  return { ok: true, mtime: await mtime("sessions", id, "canvas.excalidraw") };
});
