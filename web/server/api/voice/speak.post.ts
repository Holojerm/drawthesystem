export default defineEventHandler(async (event) => {
  const { text } = await readBody<{ text: string }>(event);
  if (text?.trim()) { voice.outbox.push(text); await logLine("Interviewer", text); }
  return { queued: true };
});
