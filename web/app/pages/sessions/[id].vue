<script setup lang="ts">
definePageMeta({ layout: "workspace" });
const route = useRoute();
const id = computed(() => String(route.params.id));
const toast = useToast();
const colorMode = useColorMode();

const { data: session, refresh } = await useFetch(() => `/api/sessions/${id.value}`, { key: `session-${id.value}` });
if (!session.value) throw createError({ statusCode: 404, statusMessage: "Session not found", fatal: true });

// ---- canvas ---------------------------------------------------------------
type Scene = { elements: any[]; appState?: Record<string, any>; files?: Record<string, any>; mtime?: number | null };
type View = "canvas" | "solution" | "solution45";
const view = ref<View>("canvas");
const canvas = ref<{ load: (s: Scene) => Promise<void>; getScene?: () => any } | null>(null);
const saveState = ref<"saved" | "saving" | "dirty" | "error">("saved");
const savedAt = ref<number | null>(null);
let knownMtime: number | null = null;
let knownSolutionMtime: number | null = null;

async function loadCanvas(which: View = "canvas") {
  const s = await $fetch<Scene>(`/api/sessions/${id.value}/canvas`, { query: { which } });
  if (which === "canvas") knownMtime = s.mtime ?? null; else knownSolutionMtime = s.mtime ?? null;
  await canvas.value?.load(s);
}

async function onCanvasChange(sc: { elements: any[]; appState: any; files: any }) {
  if (view.value !== "canvas") return;
  if (externalChange.value) { saveState.value = "dirty"; return; } // don't fight the disk; user must choose
  saveState.value = "saving";
  try {
    const r = await $fetch<{ mtime: number }>(`/api/sessions/${id.value}/canvas`, { method: "PUT", body: { ...sc, baseMtime: knownMtime } });
    knownMtime = r.mtime; savedAt.value = Date.now(); saveState.value = "saved";
  } catch (e: any) {
    if (e?.statusCode === 409 || e?.status === 409) { externalChange.value = true; saveState.value = "dirty"; }
    else saveState.value = "error";
  }
}
// If the agent (or excalidraw.com "Save to…") rewrote canvas.excalidraw on disk:
// reload silently when this tab has no unsaved edits, otherwise offer reload / overwrite.
const externalChange = ref(false);
useIntervalFn(async () => {
  const s = await $fetch<any>(`/api/sessions/${id.value}`).catch(() => null);
  if (!s) return;
  // agent-driven clock (bun scripts/session.mjs start) wins over the local one
  if (s.state?.startedAt && s.state.startedAt !== startedAt.value) startedAt.value = s.state.startedAt;
  if (s.state?.startedAt && s.state?.endedAt) startedAt.value = 0;
  if (s.state?.minutes) stateMinutes.value = s.state.minutes;
  if (view.value !== "canvas") {
    if (s.solutionMtime && knownSolutionMtime && s.solutionMtime > knownSolutionMtime + 50) { knownSolutionMtime = s.solutionMtime; await loadCanvas("solution"); toast.add({ title: "Solution updated", icon: "i-lucide-refresh-cw" }); }
    else if (s.solutionMtime && !knownSolutionMtime) knownSolutionMtime = s.solutionMtime;
    return;
  }
  if (saveState.value === "saving") return;
  if (s.canvasMtime && knownMtime && s.canvasMtime > knownMtime + 50) {
    if (saveState.value === "saved") { await loadCanvas("canvas"); toast.add({ title: "Canvas updated from disk", icon: "i-lucide-refresh-cw" }); }
    else externalChange.value = true;
  }
}, 2000);
async function reloadFromDisk() { externalChange.value = false; await loadCanvas("canvas"); saveState.value = "saved"; toast.add({ title: "Canvas reloaded from disk", icon: "i-lucide-refresh-cw" }); }
async function overwriteDisk() {
  const sc = canvas.value?.getScene?.(); if (!sc) return;
  externalChange.value = false; knownMtime = null;
  await onCanvasChange(sc);
}
async function switchView(v: View) { if (v === view.value) return; await loadCanvas(v); view.value = v; }

// ---- side panel -----------------------------------------------------------
const tab = ref("prompt");
const tabs = computed(() => [
  { value: "prompt", label: "Prompt", icon: "i-lucide-scroll-text" },
  { value: "notes", label: "Notes", icon: "i-lucide-notebook-pen" },
  { value: "feedback", label: "Feedback", icon: "i-lucide-clipboard-check", disabled: !session.value?.files["feedback.md"] },
  { value: "solution", label: "Solution", icon: "i-lucide-lightbulb", disabled: !session.value?.files["solution.md"] },
]);
const notes = ref(session.value?.files["notes.md"] ?? "");
const notesState = ref<"saved" | "saving" | "dirty">("saved");
let notesTimer: any = null;
watch(notes, () => { notesState.value = "dirty"; clearTimeout(notesTimer); notesTimer = setTimeout(saveNotes, 800); });
async function saveNotes() {
  notesState.value = "saving";
  await $fetch(`/api/sessions/${id.value}/file`, { method: "PUT", body: { name: "notes.md", content: notes.value } });
  notesState.value = "saved";
}

// ---- timer ----------------------------------------------------------------
const stateMinutes = ref<number | null>(null);
const minutes = computed(() => stateMinutes.value ?? session.value?.minutes ?? 45);
const startedAt = useLocalStorage<number>(`sdp.timer.${id.value}`, 0);
const now = ref(Date.now());
useIntervalFn(() => (now.value = Date.now()), 1000);
const elapsed = computed(() => startedAt.value ? Math.floor((now.value - startedAt.value) / 1000) : 0);
const remaining = computed(() => minutes.value * 60 - elapsed.value);
const clock = computed(() => { const s = Math.abs(remaining.value); return `${remaining.value < 0 ? "-" : ""}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; });
const timerColor = computed(() => !startedAt.value ? "neutral" : remaining.value < 0 ? "error" : remaining.value < 600 ? "warning" : "primary");
function toggleTimer() { startedAt.value = startedAt.value ? 0 : Date.now(); }

const showVoice = useLocalStorage<boolean>("sdp.showVoice", true);
const showSide = useLocalStorage<boolean>("sdp.showSide", true);
// Narrow screens: one pane at a time.
const narrow = useMediaQuery("(max-width: 1023px)");
const pane = ref<"brief" | "canvas" | "talk">("canvas");
const paneItems = [
  { value: "brief", label: "Brief", icon: "i-lucide-scroll-text" },
  { value: "canvas", label: "Canvas", icon: "i-lucide-pen-line" },
  { value: "talk", label: "Talk", icon: "i-lucide-mic" },
];
const sideVisible = computed(() => narrow.value ? pane.value === "brief" : showSide.value);
const canvasVisible = computed(() => narrow.value ? pane.value === "canvas" : true);
const voiceVisible = computed(() => narrow.value ? pane.value === "talk" : showVoice.value);
const canvasTheme = computed(() => (colorMode.value === "dark" ? "dark" : "light"));

useHead({ title: () => `${session.value?.title ?? "Session"} · sysdesign-prep` });
</script>

<template>
  <div v-if="session" class="flex flex-col h-[calc(100vh-3rem)]">
    <!-- toolbar -->
    <div class="h-11 shrink-0 border-b border-default flex items-center gap-2 px-3 text-sm">
      <UButton to="/sessions" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="xs" aria-label="Back" />
      <div class="min-w-0 flex-1 lg:flex-none">
        <div class="font-medium truncate leading-tight">{{ session.title }}</div>
        <div class="text-[11px] text-muted leading-tight capitalize truncate hidden sm:block">{{ session.company }} · {{ session.mode ?? "session" }} · {{ session.date }}</div>
      </div>
      <UFieldGroup v-if="!narrow" size="xs" class="ml-4">
        <UButton :variant="view === 'canvas' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-pen-line" @click="switchView('canvas')">My canvas</UButton>
        <UButton :variant="view === 'solution45' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-timer" :disabled="!session.hasSolution45" @click="switchView('solution45')">45-min answer</UButton>
        <UButton :variant="view === 'solution' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-lightbulb" :disabled="!session.hasSolution" @click="switchView('solution')">Full reference</UButton>
      </UFieldGroup>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-[11px] text-muted hidden lg:inline">
          <template v-if="view === 'solution'">read-only · full reference (for study, not the 45-min bar)</template>
          <template v-else-if="view === 'solution45'">read-only · what a strong 45-minute answer looks like</template>
          <template v-else-if="saveState === 'saving'">saving…</template>
          <template v-else-if="saveState === 'error'" class="text-error">save failed</template>
          <template v-else-if="savedAt">saved · canvas.excalidraw</template>
          <template v-else>autosaves to sessions/{{ id }}/canvas.excalidraw</template>
        </span>
        <template v-if="externalChange">
          <UButton size="xs" color="warning" variant="subtle" icon="i-lucide-refresh-cw" @click="reloadFromDisk">Changed on disk — reload</UButton>
          <UButton size="xs" color="neutral" variant="ghost" @click="overwriteDisk">keep mine</UButton>
        </template>
        <UButton :color="timerColor" :variant="startedAt ? 'subtle' : 'outline'" size="xs" :icon="startedAt ? 'i-lucide-square' : 'i-lucide-timer'" class="tabular-nums font-mono" @click="toggleTimer">{{ startedAt ? clock : `${minutes}:00` }}</UButton>
        <template v-if="!narrow">
          <UButton :icon="showSide ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" color="neutral" variant="ghost" size="xs" aria-label="Toggle side panel" @click="showSide = !showSide" />
          <UButton :icon="showVoice ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'" color="neutral" variant="ghost" size="xs" aria-label="Toggle voice panel" @click="showVoice = !showVoice" />
        </template>
      </div>
    </div>
    <div v-if="narrow" class="shrink-0 border-b border-default px-2 py-1 flex items-center gap-2">
      <UTabs v-model="pane" :items="paneItems" size="xs" :content="false" class="flex-1" />
      <UFieldGroup v-if="session.hasSolution" size="xs">
        <UButton :variant="view === 'canvas' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-pen-line" @click="switchView('canvas')" />
        <UButton v-if="session.hasSolution45" :variant="view === 'solution45' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-timer" @click="switchView('solution45')" />
        <UButton :variant="view === 'solution' ? 'solid' : 'subtle'" color="neutral" icon="i-lucide-lightbulb" @click="switchView('solution')" />
      </UFieldGroup>
    </div>

    <div class="flex-1 min-h-0 flex">
      <!-- side panel -->
      <aside v-show="sideVisible" class="w-full lg:w-[380px] shrink-0 lg:border-r border-default flex flex-col min-h-0">
        <UTabs v-model="tab" :items="tabs" size="xs" variant="link" :content="false" class="px-2 pt-1 shrink-0" />
        <div class="flex-1 min-h-0 overflow-y-auto p-4">
          <MarkdownView v-if="tab === 'prompt'" :source="session.files['prompt.md']" empty="No prompt.md in this session." />
          <div v-else-if="tab === 'notes'" class="h-full flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs text-muted"><span>notes.md — requirements, estimates, API, trade-offs</span><span>{{ notesState === 'saved' ? 'saved' : notesState === 'saving' ? 'saving…' : '' }}</span></div>
            <UTextarea v-model="notes" autoresize :rows="24" class="flex-1 font-mono text-xs" :ui="{ base: 'h-full' }" placeholder="## Requirements&#10;- …&#10;&#10;## Estimates&#10;- …" />
          </div>
          <MarkdownView v-else-if="tab === 'feedback'" :source="session.files['feedback.md']" empty="Not graded yet — finish /mock or run /critique." />
          <MarkdownView v-else-if="tab === 'solution'" :source="session.files['solution.md']" empty="Run /solution after you've been graded." />
        </div>
      </aside>

      <!-- canvas -->
      <section v-show="canvasVisible" class="flex-1 min-w-0 relative bg-white dark:bg-neutral-900">
        <ClientOnly>
          <ExcalidrawCanvas ref="canvas" :read-only="view !== 'canvas'" :theme="canvasTheme" @change="onCanvasChange" @ready="loadCanvas(view)" />
          <template #fallback><div class="absolute inset-0 grid place-items-center text-sm text-muted">Loading canvas…</div></template>
        </ClientOnly>
      </section>

      <!-- voice / transcript -->
      <aside v-show="voiceVisible" class="w-full lg:w-[340px] shrink-0 lg:border-l border-default min-h-0">
        <ClientOnly><VoicePanel :session-id="id" /></ClientOnly>
      </aside>
    </div>
  </div>
</template>
