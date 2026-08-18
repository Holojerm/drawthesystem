export default defineEventHandler(() => {
  voice.lastSeen = Date.now();
  return { speak: voice.outbox.splice(0), listening: voice.waiters.length > 0, transcript: voice.transcript.slice(-50) };
});
