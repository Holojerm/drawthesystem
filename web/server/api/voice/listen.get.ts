export default defineEventHandler(async (event) => {
  const max = Number(getQuery(event).max ?? 90) * 1000;
  return { text: await waitForUtterance(max) };
});
