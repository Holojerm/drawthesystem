export default defineEventHandler(async (event) => {
  const { text } = await readBody<{ text: string }>(event);
  const t = text?.trim();
  if (t) { await logLine("Candidate", t); deliverUtterance(t); }
  return { ok: true };
});
