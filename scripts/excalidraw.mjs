#!/usr/bin/env bun
/**
 * excalidraw.mjs — build a valid .excalidraw file from a simple graph spec.
 *
 * Usage:
 *   bun scripts/excalidraw.mjs spec.json out.excalidraw
 *   cat spec.json | bun scripts/excalidraw.mjs - out.excalidraw
 *
 * Spec format (JSON):
 * {
 *   "title": "Optional title rendered at top",
 *   "nodes": [
 *     { "id": "client", "label": "Mobile Client", "kind": "client", "layer": 0 },
 *     { "id": "api",    "label": "API Gateway",   "kind": "service", "layer": 1 },
 *     { "id": "db",     "label": "Postgres\n(orders)", "kind": "db", "layer": 3, "note": "sharded by user_id" }
 *   ],
 *   "edges": [
 *     { "from": "client", "to": "api", "label": "HTTPS" },
 *     { "from": "api", "to": "db", "label": "read/write", "style": "dashed" }
 *   ],
 *   "groups": [ { "label": "Order Service", "nodes": ["api", "db"] } ],
 *   "notes": [ "Assumption: 10k writes/s peak" ]
 * }
 *
 * Layout: nodes are placed in columns by `layer` (0 = leftmost) and stacked
 * vertically in the order given (group members first when `groups` exist, so a
 * group's frame is a clean band — keep each group's members in adjacent layers
 * and at most one per column where possible). Override with explicit `x`,`y`.
 * `kind` picks a colour: client | service | db | cache | queue | storage |
 * external | lb | cdn | note (default: service).
 */
import { readFileSync, writeFileSync } from "node:fs";

const KIND_STYLE = {
  client:   { bg: "#e9ecef", stroke: "#1e1e1e" },
  service:  { bg: "#a5d8ff", stroke: "#1971c2" },
  lb:       { bg: "#d0bfff", stroke: "#6741d9" },
  cdn:      { bg: "#d0bfff", stroke: "#6741d9" },
  db:       { bg: "#b2f2bb", stroke: "#2f9e44" },
  cache:    { bg: "#ffec99", stroke: "#f08c00" },
  queue:    { bg: "#ffd8a8", stroke: "#e8590c" },
  storage:  { bg: "#c3fae8", stroke: "#099268" },
  external: { bg: "#ffffff", stroke: "#868e96" },
  note:     { bg: "#fff9db", stroke: "#f08c00" },
};

const NODE_W = 180, NODE_H = 80, COL_GAP = 140, ROW_GAP = 60, MARGIN = 80;
const FONT = 1; // 1 = hand-drawn (Virgil), 2 = normal, 3 = code

let seedCounter = 1000;
const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6);
const seed = () => (seedCounter += 7919) % 2147483647;
const now = () => Date.now();

function base(type, x, y, w, h, extra = {}) {
  return {
    id: rid(),
    type,
    x, y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : type === "arrow" ? { type: 2 } : null,
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: [],
    updated: now(),
    link: null,
    locked: false,
    ...extra,
  };
}

function textEl(text, x, y, w, h, opts = {}) {
  const fontSize = opts.fontSize ?? 16;
  const lines = text.split("\n");
  const lineH = fontSize * 1.25;
  const tw = w ?? Math.max(...lines.map(l => l.length)) * fontSize * 0.6;
  const th = h ?? lines.length * lineH;
  return base("text", x, y, tw, th, {
    text,
    originalText: text,
    fontSize,
    fontFamily: FONT,
    textAlign: opts.align ?? "center",
    verticalAlign: opts.valign ?? "middle",
    containerId: opts.containerId ?? null,
    lineHeight: 1.25,
    autoResize: true,
    baseline: Math.round(th - fontSize * 0.25),
    strokeColor: opts.color ?? "#1e1e1e",
    roundness: null,
  });
}

function rectWithLabel(x, y, w, h, label, style, extra = {}) {
  const rect = base("rectangle", x, y, w, h, {
    backgroundColor: style.bg,
    strokeColor: style.stroke,
    ...extra,
  });
  const t = textEl(label, x + 10, y + 10, w - 20, h - 20, { containerId: rect.id, fontSize: 16 });
  rect.boundElements.push({ id: t.id, type: "text" });
  return [rect, t];
}

function center(n) { return { cx: n.x + n.width / 2, cy: n.y + n.height / 2 }; }

// Point on the border of rect r along the ray from its centre toward (tx,ty)
function borderPoint(r, tx, ty) {
  const { cx, cy } = center(r);
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = r.width / 2, hh = r.height / 2;
  const sx = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

function arrowBetween(a, b, label, style = "solid") {
  const bc = center(b), ac = center(a);
  const p1 = borderPoint(a, bc.cx, bc.cy);
  const p2 = borderPoint(b, ac.cx, ac.cy);
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const arrow = base("arrow", p1.x, p1.y, Math.abs(dx), Math.abs(dy), {
    points: [[0, 0], [dx, dy]],
    lastCommittedPoint: null,
    startBinding: { elementId: a.id, focus: 0, gap: 4 },
    endBinding: { elementId: b.id, focus: 0, gap: 4 },
    startArrowhead: null,
    endArrowhead: "arrow",
    strokeStyle: style === "dashed" ? "dashed" : style === "dotted" ? "dotted" : "solid",
    elbowed: false,
  });
  a.boundElements.push({ id: arrow.id, type: "arrow" });
  b.boundElements.push({ id: arrow.id, type: "arrow" });
  const out = [arrow];
  if (label) {
    const fontSize = 14;
    const tw = label.length * fontSize * 0.6 + 8, th = fontSize * 1.25;
    const t = textEl(label, p1.x + dx / 2 - tw / 2, p1.y + dy / 2 - th / 2, tw, th, {
      containerId: arrow.id, fontSize,
    });
    arrow.boundElements.push({ id: t.id, type: "text" });
    out.push(t);
  }
  return out;
}

export function buildExcalidraw(spec) {
  const elements = [];
  const byId = new Map();
  let yTop = MARGIN;

  if (spec.title) {
    elements.push(textEl(spec.title, MARGIN, yTop, null, null, { fontSize: 28, align: "left" }));
    yTop += 70;
  }

  // Layout by layer
  const layers = new Map();
  for (const n of spec.nodes ?? []) {
    const l = n.layer ?? 0;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l).push(n);
  }
  const layerKeys = [...layers.keys()].sort((a, b) => a - b);
  const maxRows = Math.max(1, ...[...layers.values()].map(v => v.length));
  const totalH = maxRows * NODE_H + (maxRows - 1) * ROW_GAP;

  // With groups: top-align columns and put group members first (in group order)
  // so a group's frame forms a clean horizontal band instead of swallowing
  // unrelated nodes. Without groups: vertically centre each column.
  const groupRank = new Map();
  (spec.groups ?? []).forEach((g, gi) => (g.nodes ?? []).forEach(id => { if (!groupRank.has(id)) groupRank.set(id, gi); }));
  const hasGroups = groupRank.size > 0;

  for (const l of layerKeys) {
    const col = layers.get(l);
    if (hasGroups) col.sort((a, b) => (groupRank.get(a.id) ?? 1e9) - (groupRank.get(b.id) ?? 1e9));
    const colH = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const yStart = hasGroups ? yTop : yTop + (totalH - colH) / 2;
    col.forEach((n, i) => {
      const x = n.x ?? MARGIN + layerKeys.indexOf(l) * (NODE_W + COL_GAP);
      const y = n.y ?? yStart + i * (NODE_H + ROW_GAP);
      const w = n.width ?? NODE_W, h = n.height ?? NODE_H;
      const style = KIND_STYLE[n.kind ?? "service"] ?? KIND_STYLE.service;
      const [rect, t] = rectWithLabel(x, y, w, h, n.label ?? n.id, style);
      byId.set(n.id, rect);
      elements.push(rect, t);
      if (n.note) {
        elements.push(textEl(n.note, x, y + h + 6, w, null, { fontSize: 12, color: "#868e96" }));
      }
    });
  }

  for (const e of spec.edges ?? []) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) { console.error(`edge references unknown node: ${e.from} -> ${e.to}`); continue; }
    elements.push(...arrowBetween(a, b, e.label, e.style));
  }

  // Groups: a dashed rectangle around member nodes, drawn behind them
  const groupEls = [];
  for (const g of spec.groups ?? []) {
    const members = (g.nodes ?? []).map(id => byId.get(id)).filter(Boolean);
    if (!members.length) continue;
    const pad = 24;
    const minX = Math.min(...members.map(m => m.x)) - pad;
    const minY = Math.min(...members.map(m => m.y)) - pad - 20;
    const maxX = Math.max(...members.map(m => m.x + m.width)) + pad;
    const maxY = Math.max(...members.map(m => m.y + m.height)) + pad;
    const frame = base("rectangle", minX, minY, maxX - minX, maxY - minY, {
      strokeStyle: "dashed", strokeColor: "#868e96", backgroundColor: "transparent", roughness: 0,
    });
    const label = textEl(g.label ?? "", minX + 8, minY + 4, null, null, { fontSize: 14, align: "left", color: "#868e96" });
    groupEls.push(frame, label);
  }
  elements.unshift(...groupEls);

  // Free-floating notes bottom-left
  if (spec.notes?.length) {
    const y = yTop + totalH + 80;
    const text = spec.notes.map(n => "• " + n).join("\n");
    const [rect, t] = rectWithLabel(MARGIN, y, 520, 30 + spec.notes.length * 22, text, KIND_STYLE.note);
    t.textAlign = "left";
    elements.push(rect, t);
  }

  return {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements,
    appState: { viewBackgroundColor: "#ffffff", gridSize: null },
    files: {},
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inPath, outPath] = process.argv;
  if (!inPath || !outPath) {
    console.error("usage: excalidraw.mjs <spec.json|-> <out.excalidraw>");
    process.exit(1);
  }
  const raw = inPath === "-" ? readFileSync(0, "utf8") : readFileSync(inPath, "utf8");
  const spec = JSON.parse(raw);
  writeFileSync(outPath, JSON.stringify(buildExcalidraw(spec), null, 2));
  console.log(`wrote ${outPath} (${spec.nodes?.length ?? 0} nodes, ${spec.edges?.length ?? 0} edges)`);
}
