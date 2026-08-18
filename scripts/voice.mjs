#!/usr/bin/env bun
/**
 * voice.mjs — browser-native voice bridge for /mock (zero deps).
 *
 *   bun scripts/voice.mjs serve [--port 7788]   # start bridge + open http://localhost:7788 in a browser (Chrome/Safari)
 *   bun scripts/voice.mjs speak "text"          # interviewer says this (browser TTS via speechSynthesis)
 *   bun scripts/voice.mjs listen [--max 90]     # block until the candidate finishes an utterance; print transcript
 *   bun scripts/voice.mjs status                # is the bridge up and a browser attached?
 *   bun scripts/voice.mjs log                   # print sessions transcript so far
 *
 * The page uses the Web Speech API (SpeechRecognition + speechSynthesis): free,
 * no keys, works in Chrome and Safari. Premium engines can be swapped in by
 * editing the two functions marked PLUGGABLE in the HTML below.
 *
 * If the Nuxt workbench (web/) is running it hosts the same bridge under
 * /api/voice/*, and `speak`/`listen`/`status`/`log` talk to it automatically —
 * `serve` is only the no-dependencies fallback page.
 *
 * Env: VOICE_URL (default http://localhost:7788), VOICE_PORT, VOICE_LANG
 * (default en-US), VOICE_TTS=say to use macOS `say` instead of browser TTS.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.VOICE_PORT ?? argOf("--port") ?? 7788);
const LANG = process.env.VOICE_LANG ?? "en-US";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , cmd, ...rest] = process.argv;

function argOf(flag) { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : undefined; }
const base = process.env.VOICE_URL ?? `http://localhost:${PORT}`;
// The web workbench (web/) serves the same endpoints under /api/voice/*; the
// standalone `serve` below uses bare paths. Detect which one is running.
let apiPrefix = null;
async function api(path, init) {
  if (apiPrefix === null) {
    const probe = await fetch(`${base}/api/voice/status`).catch(() => null);
    apiPrefix = probe && probe.ok ? "/api/voice" : "";
  }
  return fetch(`${base}${apiPrefix}${path}`, init);
}

// ---------------------------------------------------------------- server ----
if (cmd === "serve") {
  const state = { outbox: [], inbox: [], waiters: [], lastSeen: 0, transcript: [] };
  const logPath = argOf("--log") ?? join(ROOT, "sessions", ".voice-transcript.md");
  mkdirSync(dirname(logPath), { recursive: true });
  const log = (who, text) => { const line = `**${who}:** ${text}\n\n`; state.transcript.push(line); appendFileSync(logPath, line); };

  const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify(obj)); };
  const body = req => new Promise(r => { let s = ""; req.on("data", d => s += d).on("end", () => r(s ? JSON.parse(s) : {})); });

  http.createServer(async (req, res) => {
    const u = new URL(req.url, base);
    if (req.method === "GET" && u.pathname === "/") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(PAGE); }
    if (u.pathname === "/status") return json(res, 200, { up: true, browserAttached: Date.now() - state.lastSeen < 5000, pendingSpeech: state.outbox.length, transcriptLines: state.transcript.length });
    if (u.pathname === "/speak" && req.method === "POST") { const { text } = await body(req); state.outbox.push(text); log("Interviewer", text); return json(res, 200, { queued: true }); }
    if (u.pathname === "/poll") { state.lastSeen = Date.now(); const items = state.outbox.splice(0); return json(res, 200, { speak: items, listening: state.waiters.length > 0 }); }
    if (u.pathname === "/utterance" && req.method === "POST") {
      const { text } = await body(req);
      if (text?.trim()) { log("Candidate", text.trim()); const w = state.waiters.shift(); if (w) w(text.trim()); else state.inbox.push(text.trim()); }
      return json(res, 200, { ok: true });
    }
    if (u.pathname === "/listen") {
      const max = Number(u.searchParams.get("max") ?? 90) * 1000;
      if (state.inbox.length) return json(res, 200, { text: state.inbox.splice(0).join(" ") });
      let done = false;
      const finish = text => { if (done) return; done = true; json(res, 200, { text }); };
      state.waiters.push(finish);
      setTimeout(() => { if (!done) { state.waiters = state.waiters.filter(w => w !== finish); finish(null); } }, max);
      return;
    }
    if (u.pathname === "/log") { res.writeHead(200, { "Content-Type": "text/markdown" }); return res.end(state.transcript.join("")); }
    json(res, 404, { error: "not found" });
  }).listen(PORT, () => {
    console.log(`voice bridge on ${base}  (transcript → ${logPath})`);
    const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    if (!process.argv.includes("--no-open")) spawn(opener, [base], { stdio: "ignore", detached: true }).unref();
  });
}

// ---------------------------------------------------------------- client ----
else if (cmd === "speak") {
  const text = rest.filter(a => !a.startsWith("--")).join(" ");
  if (!text) { console.error("speak: no text"); process.exit(1); }
  if (process.env.VOICE_TTS === "say" && process.platform === "darwin") {
    await api(`/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {});
    spawn("say", [text], { stdio: "inherit" }).on("exit", () => process.exit(0));
  } else {
    const r = await api(`/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => null);
    if (!r) { console.error(`voice bridge not running — start the workbench (bun run web) or: bun scripts/voice.mjs serve`); process.exit(2); }
    console.log("queued for speech");
  }
} else if (cmd === "listen") {
  const max = argOf("--max") ?? 90;
  const r = await api(`/listen?max=${max}`).catch(() => null);
  if (!r) { console.error(`voice bridge not running — start the workbench (bun run web) or: bun scripts/voice.mjs serve`); process.exit(2); }
  const { text } = await r.json();
  if (text == null) { console.log("(no speech within " + max + "s — candidate may be thinking/drawing; call listen again or prompt them)"); process.exit(3); }
  console.log(text);
} else if (cmd === "status") {
  const r = await api(`/status`).catch(() => null);
  console.log(r ? JSON.stringify(await r.json()) : JSON.stringify({ up: false }));
} else if (cmd === "log") {
  const r = await api(`/log`).catch(() => null);
  console.log(r ? await r.text() : "(bridge not running)");
} else {
  console.error("usage: voice.mjs serve|speak <text>|listen [--max N]|status|log");
  process.exit(1);
}

// ------------------------------------------------------------------ page ----
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>sysdesign-prep voice</title>
<style>
body{font:16px/1.5 system-ui;margin:0;padding:24px;max-width:720px;margin:auto;background:#fafafa;color:#222}
h1{font-size:18px;margin:0 0 8px}.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid #bbb;background:#fff;cursor:pointer}
button.on{background:#d33;color:#fff;border-color:#d33}
#status{font-size:13px;color:#666}#live{min-height:2em;padding:8px 12px;background:#fff;border:1px solid #ddd;border-radius:8px;color:#888;font-style:italic}
#log{margin-top:16px}#log p{margin:6px 0;padding:8px 12px;border-radius:8px;background:#fff;border:1px solid #eee}
#log p.me{background:#eef5ff}#log p.ai{background:#f3fff0}
label{font-size:13px;white-space:nowrap}
</style></head><body>
<h1>🎙 sysdesign-prep — voice mode</h1>
<div id="status">connecting…</div>
<div class="row">
  <button id="mic">Start listening</button>
  <label><input type="checkbox" id="ptt"> push-to-talk (hold Space)</label>
  <label>voice <select id="voices"></select></label>
  <button id="stop">Stop speaking</button>
</div>
<div id="live">…</div>
<div id="log"></div>
<script>
const LANG=${JSON.stringify(LANG)};
const $=s=>document.querySelector(s);
const status=$("#status"),live=$("#live"),log=$("#log"),micBtn=$("#mic"),ptt=$("#ptt"),voicesSel=$("#voices");
const add=(who,text)=>{const p=document.createElement("p");p.className=who==="me"?"me":"ai";p.textContent=(who==="me"?"You: ":"Interviewer: ")+text;log.prepend(p);};

// ---- PLUGGABLE: TTS ---------------------------------------------------------
function speak(text){return new Promise(res=>{const u=new SpeechSynthesisUtterance(text);u.lang=LANG;u.rate=1.02;
  const v=speechSynthesis.getVoices().find(v=>v.name===voicesSel.value);if(v)u.voice=v;
  u.onend=res;u.onerror=res;muted=true;if(rec&&active)rec.stop();speechSynthesis.speak(u);}).then(()=>{muted=false;if(wantListening&&!ptt.checked)startRec();});}
$("#stop").onclick=()=>speechSynthesis.cancel();
const PREF=["Samantha","Google US English","Daniel","Karen","Aria","Alex","Microsoft Aria"];
function fillVoices(){const all=speechSynthesis.getVoices().filter(v=>v.lang.replace("_","-").startsWith(LANG.slice(0,2)));
  const novelty=/(Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Albert|Fred|Junior|Kathy|Ralph|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)/;
  const vs=all.filter(v=>!novelty.test(v.name)).sort((a,b)=>(PREF.findIndex(p=>a.name.startsWith(p))+1||99)-(PREF.findIndex(p=>b.name.startsWith(p))+1||99));
  voicesSel.innerHTML=vs.map((v,i)=>'<option'+(i===0?" selected":"")+'>'+v.name+'</option>').join("");}
speechSynthesis.onvoiceschanged=fillVoices;fillVoices();

// ---- PLUGGABLE: STT ---------------------------------------------------------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,wantListening=false,active=false,muted=false,buffer="",silenceTimer=null;
function startRec(){if(!SR){status.textContent="SpeechRecognition not supported — use Chrome or Safari.";return;}
  if(active)return;rec=new SR();rec.lang=LANG;rec.continuous=true;rec.interimResults=true;
  rec.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal){buffer+=(buffer?" ":"")+r[0].transcript.trim();}else interim+=r[0].transcript;}
    live.textContent=(buffer+" "+interim).trim()||"…";
    clearTimeout(silenceTimer);silenceTimer=setTimeout(flush,ptt.checked?1e9:1800);};
  rec.onend=()=>{active=false;if(wantListening&&!muted&&!ptt.checked)setTimeout(startRec,150);};
  rec.onerror=e=>{if(e.error==="not-allowed")status.textContent="Mic permission denied.";};
  rec.start();active=true;}
async function flush(){const text=buffer.trim();buffer="";live.textContent="…";if(!text)return;add("me",text);
  await fetch("/utterance",{method:"POST",body:JSON.stringify({text})});}
micBtn.onclick=()=>{wantListening=!wantListening;micBtn.textContent=wantListening?"Listening… (click to stop)":"Start listening";micBtn.classList.toggle("on",wantListening);
  if(wantListening&&!ptt.checked)startRec();else{if(rec)rec.stop();flush();}};
document.addEventListener("keydown",e=>{if(ptt.checked&&e.code==="Space"&&wantListening&&!e.repeat){e.preventDefault();startRec();}});
document.addEventListener("keyup",e=>{if(ptt.checked&&e.code==="Space"&&wantListening){e.preventDefault();if(rec)rec.stop();setTimeout(flush,300);}});

// ---- bridge poll ------------------------------------------------------------
let speaking=Promise.resolve();
async function poll(){try{const r=await fetch("/poll");const {speak:items,listening}=await r.json();
  status.textContent="connected · "+(wantListening?"mic on":"mic off")+(listening?" · interviewer is waiting for you":"");
  for(const t of items){if(t){add("ai",t);speaking=speaking.then(()=>speak(t));}}}catch{status.textContent="bridge disconnected — restart: bun scripts/voice.mjs serve";}
  setTimeout(poll,700);}
poll();
</script></body></html>`;
