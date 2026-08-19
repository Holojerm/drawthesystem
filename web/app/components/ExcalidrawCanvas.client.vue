<script setup lang="ts">
/**
 * Excalidraw is a React component; we mount it once as a React island inside
 * Vue and drive it imperatively. The parent owns persistence:
 *   - `load(scene)` replaces the scene (used for initial load, reload-from-disk,
 *     and switching between the user's canvas and the reference solution)
 *   - `change` is emitted (debounced) whenever the user edits
 * Nothing is emitted until a scene has been loaded, so a transient empty scene
 * during mount can never overwrite the file on disk.
 */
import * as ReactNS from "react";
import * as ReactDOMClientNS from "react-dom/client";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

// Vite's CJS interop for React can expose these on `default` instead of as named exports.
const createElement: typeof ReactNS.createElement = (ReactNS as any).createElement ?? (ReactNS as any).default.createElement;
const createRoot: typeof ReactDOMClientNS.createRoot = (ReactDOMClientNS as any).createRoot ?? (ReactDOMClientNS as any).default.createRoot;

export type Scene = { elements: any[]; appState?: Record<string, any>; files?: Record<string, any> };
const props = defineProps<{ readOnly?: boolean; theme?: "light" | "dark" }>();
const emit = defineEmits<{ change: [scene: { elements: any[]; appState: Record<string, any>; files: Record<string, any> }]; ready: [] }>();

const host = ref<HTMLElement>();
let root: ReturnType<typeof createRoot> | null = null;
let api: ExcalidrawImperativeAPI | null = null;
let mods: { Excalidraw: any; MainMenu: any } | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;
let ready = false;      // a scene has been loaded; changes may be emitted
let lastSig = "";
let pending: Scene | null = null; // scene requested before the API was available

const sig = (els: any[]) => JSON.stringify(els.map(e => [e.id, e.version, e.isDeleted]));
const pick = (s: any) => ({ viewBackgroundColor: s.viewBackgroundColor, gridSize: s.gridSize });

function currentScene() {
  if (!api) return null;
  return { elements: api.getSceneElementsIncludingDeleted() as any[], appState: pick(api.getAppState()), files: api.getFiles() as any };
}

function onChange() {
  if (!ready || props.readOnly) return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    const sc = currentScene(); if (!sc) return;
    const s = sig(sc.elements);
    if (s === lastSig) return;
    lastSig = s;
    emit("change", sc);
  }, 600);
}

async function load(scene: Scene) {
  if (!api) { pending = scene; return; }
  ready = false;
  api.updateScene({ elements: scene.elements ?? [], appState: { viewBackgroundColor: scene.appState?.viewBackgroundColor ?? "#ffffff" } });
  const files = Object.values(scene.files ?? {});
  if (files.length) api.addFiles(files as any);
  lastSig = sig(scene.elements ?? []);
  await new Promise(r => setTimeout(r, 50));
  if (scene.elements?.length) api.scrollToContent(undefined, { fitToContent: true, animate: false });
  await new Promise(r => setTimeout(r, 200)); // let Excalidraw settle before accepting changes
  // Baseline from what Excalidraw actually holds post-normalisation (it may add
  // fractional indices / bump versions), so a mere click never looks like an edit.
  lastSig = sig(api.getSceneElementsIncludingDeleted() as any[]);
  ready = true;
}

function render() {
  if (!root || !mods) return;
  const { Excalidraw, MainMenu: M } = mods;
  root.render(createElement(Excalidraw, {
    excalidrawAPI: (a: ExcalidrawImperativeAPI) => { api = a; if (pending) { const p = pending; pending = null; load(p).then(() => emit("ready")); } else emit("ready"); },
    onChange,
    viewModeEnabled: !!props.readOnly,
    theme: props.theme ?? "light",
    name: "sysdesign-prep",
    UIOptions: { canvasActions: { loadScene: true, saveToActiveFile: false, toggleTheme: false } },
  }, createElement(M, null,
    createElement(M.DefaultItems.LoadScene),
    createElement(M.DefaultItems.Export),
    createElement(M.DefaultItems.SaveAsImage),
    createElement(M.DefaultItems.ClearCanvas),
    createElement(M.DefaultItems.ChangeCanvasBackground),
  )));
}

onMounted(async () => {
  await nextTick();
  if (!host.value) { console.error("[ExcalidrawCanvas] host element missing"); return; }
  root = createRoot(host.value);
  const m = await import("@excalidraw/excalidraw");
  mods = { Excalidraw: m.Excalidraw, MainMenu: m.MainMenu };
  render();
});
watch(() => [props.readOnly, props.theme], render);
onBeforeUnmount(() => { if (debounce) clearTimeout(debounce); root?.unmount(); root = null; });

defineExpose({ load, getScene: currentScene });
</script>

<template>
  <div ref="host" class="excalidraw-host" />
</template>
