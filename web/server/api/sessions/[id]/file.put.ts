export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const { name, content } = await readBody<{ name: string; content: string }>(event);
  if (!EDITABLE.has(name)) throw createError({ statusCode: 400, statusMessage: "not editable" });
  await writeText(content ?? "", "sessions", id, name);
  return { ok: true, mtime: await mtime("sessions", id, name) };
});
