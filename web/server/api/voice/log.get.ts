export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "text/markdown; charset=utf-8");
  return voice.transcript.map(t => `**${t.who}:** ${t.text}\n\n`).join("");
});
