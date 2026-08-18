export default defineEventHandler(() => ({
  up: true, browserAttached: Date.now() - voice.lastSeen < 5000, pendingSpeech: voice.outbox.length,
  transcriptLines: voice.transcript.length, session: voice.session, listening: voice.waiters.length > 0,
}));
