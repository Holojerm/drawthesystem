export default defineEventHandler(async (event) => {
  const id = assertSessionId(getRouterParam(event, "id")!);
  const name = String(getQuery(event).name ?? "");
  if (!(SESSION_FILES as readonly string[]).includes(name) || name === "interviewer.md") throw createError({ statusCode: 400, statusMessage: "not readable" });
  return { name, content: await readText("sessions", id, name), mtime: await mtime("sessions", id, name) };
});
