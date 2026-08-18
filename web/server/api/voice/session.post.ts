export default defineEventHandler(async (event) => {
  const { session } = await readBody<{ session: string | null }>(event);
  voice.session = session ? assertSessionId(session) : null;
  return { session: voice.session };
});
