export default defineEventHandler(async () => {
  const md = (await readText("progress.md")) ?? "";
  const rows = md.split("\n").filter((l: string) => /^\|\s*\d{4}-/.test(l)).map((l: string) => {
    const c = l.split("|").map((s: string) => s.trim()).slice(1, -1);
    return { date: c[0], company: c[1], topic: c[2], mode: c[3], overall: Number(c[4]) || null, weakest: c[5], session: c[6] };
  });
  return { rows, markdown: md };
});
