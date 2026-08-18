/**
 * Browser-side voice bridge: Web Speech API for STT/TTS, polling /api/voice/*.
 * The two functions marked PLUGGABLE are the seam for premium engines.
 */
export interface TranscriptLine { who: "Interviewer" | "Candidate"; text: string; at: number }

export function useVoice(sessionId: Ref<string | null>) {
  const supported = ref(true);
  const listening = ref(false);      // user wants the mic on
  const recActive = ref(false);      // recognizer running right now
  const speaking = ref(false);
  const pushToTalk = ref(false);
  const agentWaiting = ref(false);   // agent is blocked in `listen`
  const connected = ref(false);
  const live = ref("");
  const transcript = ref<TranscriptLine[]>([]);
  const voices = ref<SpeechSynthesisVoice[]>([]);
  const voiceName = useLocalStorage<string>("sdp.voice", "");
  const rate = useLocalStorage<number>("sdp.rate", 1.02);
  const lang = "en-US";
  const error = ref<string | null>(null);

  let rec: any = null, buffer = "", silenceTimer: any = null, muted = false, pollTimer: any = null;
  let speakQueue: Promise<void> = Promise.resolve();

  // ---- PLUGGABLE: TTS --------------------------------------------------------
  function speak(text: string) {
    speakQueue = speakQueue.then(() => new Promise<void>(res => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = Number(rate.value) || 1;
      const v = voices.value.find(v => v.name === voiceName.value); if (v) u.voice = v;
      muted = true; speaking.value = true;
      if (rec && recActive.value) rec.stop();
      u.onend = u.onerror = () => { speaking.value = false; muted = false; if (listening.value && !pushToTalk.value) startRec(); res(); };
      speechSynthesis.speak(u);
    }));
    return speakQueue;
  }
  function stopSpeaking() { speechSynthesis.cancel(); speaking.value = false; }

  // ---- PLUGGABLE: STT --------------------------------------------------------
  function startRec() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { supported.value = false; error.value = "SpeechRecognition isn't available in this browser — use Chrome or Safari, or type instead."; return; }
    if (recActive.value) return;
    rec = new SR(); rec.lang = lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) buffer += (buffer ? " " : "") + r[0].transcript.trim(); else interim += r[0].transcript; }
      live.value = (buffer + " " + interim).trim();
      clearTimeout(silenceTimer);
      if (!pushToTalk.value) silenceTimer = setTimeout(flush, 1800);
    };
    rec.onend = () => { recActive.value = false; if (listening.value && !muted && !pushToTalk.value) setTimeout(startRec, 150); };
    rec.onerror = (e: any) => { if (e.error === "not-allowed") { error.value = "Microphone permission denied."; listening.value = false; } };
    rec.start(); recActive.value = true;
  }
  function stopRec() { if (rec && recActive.value) rec.stop(); recActive.value = false; }

  async function flush() {
    const text = buffer.trim(); buffer = ""; live.value = "";
    if (!text) return;
    await sendUtterance(text);
  }
  async function sendUtterance(text: string) {
    await $fetch("/api/voice/utterance", { method: "POST", body: { text } });
    await poll();
  }
  function toggleListening() {
    listening.value = !listening.value;
    if (listening.value && !pushToTalk.value) startRec(); else { stopRec(); flush(); }
  }
  function pttDown() { if (pushToTalk.value && listening.value) startRec(); }
  function pttUp() { if (pushToTalk.value && listening.value) { stopRec(); setTimeout(flush, 300); } }

  // ---- bridge ----------------------------------------------------------------
  async function poll() {
    try {
      const r = await $fetch<{ speak: string[]; listening: boolean; transcript: TranscriptLine[] }>("/api/voice/poll");
      connected.value = true; agentWaiting.value = r.listening; transcript.value = r.transcript;
      for (const t of r.speak) if (t) speak(t);
    } catch { connected.value = false; }
  }
  function fillVoices() {
    const all = speechSynthesis.getVoices().filter(v => v.lang.replace("_", "-").startsWith("en"));
    const novelty = /(Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Albert|Fred|Junior|Kathy|Ralph|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)/;
    const pref = ["Samantha", "Google US English", "Daniel", "Karen", "Aria", "Alex"];
    voices.value = all.filter(v => !novelty.test(v.name)).sort((a, b) => (pref.findIndex(p => a.name.startsWith(p)) + 1 || 99) - (pref.findIndex(p => b.name.startsWith(p)) + 1 || 99));
    if (!voiceName.value && voices.value[0]) voiceName.value = voices.value[0].name;
  }

  onMounted(() => {
    fillVoices(); speechSynthesis.onvoiceschanged = fillVoices;
    pollTimer = setInterval(poll, 800); poll();
    $fetch("/api/voice/session", { method: "POST", body: { session: sessionId.value } }).catch(() => {});
    const kd = (e: KeyboardEvent) => { if (pushToTalk.value && e.code === "Space" && !e.repeat && !(e.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) { e.preventDefault(); pttDown(); } };
    const ku = (e: KeyboardEvent) => { if (pushToTalk.value && e.code === "Space" && !(e.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) { e.preventDefault(); pttUp(); } };
    document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
    onBeforeUnmount(() => { document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); });
  });
  onBeforeUnmount(() => { clearInterval(pollTimer); stopRec(); stopSpeaking(); listening.value = false; });
  watch(sessionId, s => $fetch("/api/voice/session", { method: "POST", body: { session: s } }).catch(() => {}));

  return { supported, listening, recActive, speaking, pushToTalk, agentWaiting, connected, live, transcript, voices, voiceName, rate, error, toggleListening, stopSpeaking, sendUtterance, poll };
}
