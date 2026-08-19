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
 * `row` (optional) pins a node to a grid row within its layer (0 = top) — use it to
 * build clean bands (e.g. row 0 control plane, row 1 real-time, row 2 pipeline).
 * Edges are routed orthogonally with distributed ports; `via: "top"|"bottom"` forces
 * a lane route around the diagram for a long/backward edge.
 * `kind` picks a colour: client | service | db | cache | queue | storage |
 * external | lb | cdn | note (default: service).
 * Node height grows with the label (wrapped to the node width), so 4–6 line
 * labels don't clip; rows take the height of their tallest node. Edge labels are
 * real Excalidraw arrow labels (text bound to the arrow), so the workbench treats
 * them like hand-made ones and read-excalidraw attributes them to the edge.
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

// ---------------------------------------------------------------- routing ----
// Orthogonal (elbow) routing. Each edge becomes a polyline of horizontal and
// vertical segments. Ports on a node side are spread out so parallel edges do
// not overlap. Segments that would cross a node are re-routed through a lane
// above or below the diagram.
const segHitsRect = (p, q, r, pad = 6) => {
  const x1 = Math.min(p.x, q.x) - pad, x2 = Math.max(p.x, q.x) + pad, y1 = Math.min(p.y, q.y) - pad, y2 = Math.max(p.y, q.y) + pad;
  return x1 < r.x + r.width && x2 > r.x && y1 < r.y + r.height && y2 > r.y;
};
const pathHits = (pts, rects) => pts.some((p, i) => i > 0 && rects.some(r => segHitsRect(pts[i - 1], p, r)));

// Assign ports: for every (node, side) collect edges, then spread along the side.
function assignPorts(edges, byId) {
  const buckets = new Map(); // key node.id|side -> [{edge, end:'a'|'b', order}]
  const push = (id, side, e, end, order) => { const k = id + "|" + side; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push({ e, end, order }); };
  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    const ac = center(a), bc = center(b);
    const dx = bc.cx - ac.cx, dy = bc.cy - ac.cy;
    const sameCol = Math.abs(dx) < a.width;      // stacked vertically
    let sa, sb;
    if (e.via === "top") { sa = "top"; sb = "top"; }
    else if (e.via === "bottom") { sa = "bottom"; sb = "bottom"; }
    else if (sameCol) { sa = dy > 0 ? "bottom" : "top"; sb = dy > 0 ? "top" : "bottom"; }
    else if (dx > 0) { sa = "right"; sb = "left"; }
    else { sa = "left"; sb = "right"; }
    e._sa = sa; e._sb = sb;
    // order along the side: by the other endpoint's perpendicular coordinate
    push(e.from, sa, e, "a", (sa === "left" || sa === "right") ? bc.cy : bc.cx);
    push(e.to, sb, e, "b", (sb === "left" || sb === "right") ? ac.cy : ac.cx);
  }
  for (const [k, list] of buckets) {
    const [id, side] = k.split("|"); const n = byId.get(id);
    list.sort((u, v) => u.order - v.order);
    list.forEach((item, i) => {
      const t = (i + 1) / (list.length + 1);           // 0..1 along the side
      let pt;
      if (side === "right") pt = { x: n.x + n.width, y: n.y + n.height * t };
      else if (side === "left") pt = { x: n.x, y: n.y + n.height * t };
      else if (side === "bottom") pt = { x: n.x + n.width * t, y: n.y + n.height };
      else pt = { x: n.x + n.width * t, y: n.y };
      item.e[item.end === "a" ? "_pa" : "_pb"] = pt;
    });
  }
}

function routeEdge(e, a, b, rects, bounds) {
  const p = e._pa, q = e._pb, sa = e._sa, sb = e._sb;
  const others = rects.filter(r => r !== a && r !== b);
  const candidates = [];
  if (sa === "right" && sb === "left") {
    const gapA = a.x + a.width + COL_GAP / 2, gapB = b.x - COL_GAP / 2;
    if (Math.abs(p.y - q.y) < 20) candidates.push([p, q]);               // near-level: a tiny jog looks worse than a slight slope
    candidates.push([p, { x: gapA, y: p.y }, { x: gapA, y: q.y }, q]);   // turn early
    candidates.push([p, { x: gapB, y: p.y }, { x: gapB, y: q.y }, q]);   // turn late
  } else if (sa === "left" && sb === "right") {                            // backward
    const gapA = a.x - COL_GAP / 2, gapB = b.x + b.width + COL_GAP / 2;
    candidates.push([p, { x: gapA, y: p.y }, { x: gapA, y: q.y }, q]);
    candidates.push([p, { x: gapB, y: p.y }, { x: gapB, y: q.y }, q]);
  } else if ((sa === "bottom" && sb === "top") || (sa === "top" && sb === "bottom")) {
    if (Math.abs(p.x - q.x) < 20) candidates.push([p, q]);
    const midY = (p.y + q.y) / 2;
    candidates.push([p, { x: p.x, y: midY }, { x: q.x, y: midY }, q]);
  }
  for (const c of candidates) if (!pathHits(c, others)) return c;
  // Lane routing: leave the grid via a horizontal lane above or below it. Try
  // several ways of getting from the node to the lane (straight up/down, or out
  // the side into the column gap first) and pick the first collision-free one.
  // Lanes are staggered so parallel lane edges don't overlap.
  const laneIdx = e._lane ?? 0;
  const laneTop = bounds.top - 40 - laneIdx * 26, laneBot = bounds.bottom + 40 + laneIdx * 26;
  const preferTop = e.via === "top" || (e.via !== "bottom" && center(a).cy < (bounds.top + bounds.bottom) / 2);
  const gapL = r => r.x - COL_GAP / 2, gapR = r => r.x + r.width + COL_GAP / 2;
  const exits = (r, top) => [
    [{ x: r.x + r.width / 2, y: top ? r.y : r.y + r.height }],                                                    // straight out
    [{ x: r.x + r.width, y: r.y + r.height * 0.5 }, { x: gapR(r), y: r.y + r.height * 0.5 }],                    // out the right into the gap
    [{ x: r.x, y: r.y + r.height * 0.5 }, { x: gapL(r), y: r.y + r.height * 0.5 }],                              // out the left into the gap
  ];
  const entries = (r, top) => [
    [{ x: r.x + r.width / 2, y: top ? r.y : r.y + r.height }],                                                    // straight in
    [{ x: gapL(r), y: r.y + r.height * 0.5 }, { x: r.x, y: r.y + r.height * 0.5 }],                              // in from the left gap
    [{ x: gapR(r), y: r.y + r.height * 0.5 }, { x: r.x + r.width, y: r.y + r.height * 0.5 }],                    // in from the right gap
  ];
  const attempts = [];
  for (const top of [preferTop, !preferTop]) {
    const laneY = top ? laneTop : laneBot;
    for (const ex of exits(a, top)) for (const en of entries(b, top)) {
      const last = ex[ex.length - 1], first = en[0];
      attempts.push([...ex, { x: last.x, y: laneY }, { x: first.x, y: laneY }, ...en]);
    }
  }
  for (const c of attempts) if (!pathHits(c, others)) return c;
  return candidates[0] ?? attempts[0];
}

// Greedy word wrap to `cols` characters; explicit newlines are kept.
function wrapText(text, cols) {
  const out = [];
  for (const para of String(text).split("\n")) {
    let cur = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if (!cur) cur = w;
      else if ((cur + " " + w).length <= cols) cur += " " + w;
      else { out.push(cur); cur = w; }
    }
    out.push(cur);
  }
  return out.length ? out : [""];
}

function arrowFromPath(pts, a, b, label, style = "solid") {
  const x0 = pts[0].x, y0 = pts[0].y;
  const rel = pts.map(p => [p.x - x0, p.y - y0]);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const arrow = base("arrow", x0, y0, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), {
    points: rel,
    lastCommittedPoint: null,
    startBinding: { elementId: a.id, focus: 0, gap: 2 },
    endBinding: { elementId: b.id, focus: 0, gap: 2 },
    startArrowhead: null,
    endArrowhead: "arrow",
    strokeStyle: style === "dashed" ? "dashed" : style === "dotted" ? "dotted" : "solid",
    roundness: null,
    elbowed: false,
  });
  a.boundElements.push({ id: arrow.id, type: "arrow" });
  b.boundElements.push({ id: arrow.id, type: "arrow" });
  const out = [arrow];
  if (label) {
    // Excalidraw-native arrow label: text bound to the arrow (containerId), placed
    // where Excalidraw itself would put it (middle vertex for an odd point count,
    // middle-segment midpoint for an even one) and wrapped to the width it allows
    // (70% of the arrow's width, at least 11× the font size) — so the workbench
    // won't move or re-wrap it on first touch.
    const fontSize = 13, charW = fontSize * 0.58, lineH = fontSize * 1.25;
    const arrowW = Math.max(...xs) - Math.min(...xs);
    const maxW = Math.max(0.7 * arrowW, fontSize * 11);
    const lines = wrapText(label, Math.max(8, Math.floor(maxW / charW)));
    const tw = Math.min(maxW, Math.max(...lines.map(l => l.length)) * charW + 6), th = lines.length * lineH;
    let mx, my;
    if (pts.length % 2 === 1) { const p = pts[(pts.length - 1) / 2]; mx = p.x; my = p.y; }
    else { const i = pts.length / 2 - 1; mx = (pts[i].x + pts[i + 1].x) / 2; my = (pts[i].y + pts[i + 1].y) / 2; }
    const t = textEl(lines.join("\n"), mx - tw / 2, my - th / 2, tw, th, { fontSize, containerId: arrow.id });
    t.originalText = label;
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
    yTop += 70 + (spec.edges?.some(e => e.via === "top") ? 60 : 0);
  }

  // Layout by layer
  const layers = new Map();
  for (const n of spec.nodes ?? []) {
    const l = n.layer ?? 0;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l).push(n);
  }
  const layerKeys = [...layers.keys()].sort((a, b) => a - b);

  // With groups: top-align columns and put group members first (in group order)
  // so a group's frame forms a clean horizontal band instead of swallowing
  // unrelated nodes. Without groups: vertically centre each column.
  const groupRank = new Map();
  (spec.groups ?? []).forEach((g, gi) => (g.nodes ?? []).forEach(id => { if (!groupRank.has(id)) groupRank.set(id, gi); }));
  const hasGroups = groupRank.size > 0;

  // Node width adapts to the longest label line (capped, so long lines wrap);
  // node height adapts to the wrapped line count; a row is as tall as its
  // tallest node; column width is its widest node.
  const CHAR_W = 16 * 0.62, LINE_H = 16 * 1.25, PAD = 10;
  const widthOf = n => n.width ?? Math.min(360, Math.max(NODE_W, Math.max(...String(n.label ?? n.id).split("\n").map(l => l.length)) * CHAR_W + 28));
  const linesOf = n => String(n.label ?? n.id).split("\n").reduce((acc, l) => acc + Math.max(1, Math.ceil((l.length * CHAR_W) / (widthOf(n) - 2 * PAD))), 0);
  const heightOf = n => n.height ?? Math.max(NODE_H, linesOf(n) * LINE_H + 2 * PAD + 8);
  for (const l of layerKeys) if (hasGroups) layers.get(l).sort((a, b) => (groupRank.get(a.id) ?? 1e9) - (groupRank.get(b.id) ?? 1e9));
  // Effective row = explicit `row`, else position in the column. Row height = tallest node in it.
  const rowH = [];
  for (const l of layerKeys) layers.get(l).forEach((n, i) => { const r = n.row ?? i; rowH[r] = Math.max(rowH[r] ?? NODE_H, heightOf(n)); });
  for (let r = 0; r < rowH.length; r++) rowH[r] = rowH[r] ?? NODE_H;
  const rowY = []; { let y = yTop; for (let r = 0; r < rowH.length; r++) { rowY[r] = y; y += rowH[r] + ROW_GAP; } }
  const totalH = rowH.reduce((a, h) => a + h, 0) + (rowH.length - 1) * ROW_GAP;

  const colX = new Map(); let runX = MARGIN;
  for (const l of layerKeys) { colX.set(l, runX); runX += Math.max(...layers.get(l).map(widthOf)) + COL_GAP; }

  for (const l of layerKeys) {
    const col = layers.get(l);
    const colH = col.reduce((a, n) => a + heightOf(n), 0) + (col.length - 1) * ROW_GAP;
    const usesRows = hasGroups || col.some(n => n.row != null);
    const yStart = usesRows ? yTop : yTop + (totalH - colH) / 2;
    const colW = Math.max(...col.map(widthOf));
    let stackY = yStart;
    col.forEach((n, i) => {
      const w = widthOf(n), h = heightOf(n);
      const x = n.x ?? colX.get(l) + (colW - w) / 2;   // centre within the column
      const y = n.y ?? (usesRows ? rowY[n.row ?? i] : stackY);
      stackY += h + ROW_GAP;
      const style = KIND_STYLE[n.kind ?? "service"] ?? KIND_STYLE.service;
      const [rect, t] = rectWithLabel(x, y, w, h, n.label ?? n.id, style);
      byId.set(n.id, rect);
      elements.push(rect, t);
      if (n.note) {
        elements.push(textEl(n.note, x, y + h + 6, w, null, { fontSize: 12, color: "#868e96" }));
      }
    });
  }

  const edges = (spec.edges ?? []).filter(e => {
    if (byId.has(e.from) && byId.has(e.to)) return true;
    console.error(`edge references unknown node: ${e.from} -> ${e.to}`); return false;
  }).map(e => ({ ...e }));
  const rects = [...byId.values()];
  const bounds = { top: Math.min(...rects.map(r => r.y)), bottom: Math.max(...rects.map(r => r.y + r.height)) };
  assignPorts(edges, byId);
  // Stagger lane edges (explicit `via`, or backward edges) so they don't share a y.
  const laneCounters = { top: 0, bottom: 0 };
  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    const backward = center(b).cx < center(a).cx - a.width / 2;
    if (e.via || backward) {
      const side = e.via ?? (center(a).cy < (bounds.top + bounds.bottom) / 2 ? "top" : "bottom");
      e._lane = laneCounters[side]++;
    }
  }
  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    const pts = routeEdge(e, a, b, rects, bounds);
    elements.push(...arrowFromPath(pts, a, b, e.label, e.style));
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
    const y = (rects.length ? bounds.bottom : yTop) + 80 + laneCounters.bottom * 26;
    const text = spec.notes.map(n => "• " + n).join("\n");
    const nw = Math.min(1400, Math.max(520, Math.max(...spec.notes.map(n => n.length)) * 16 * 0.55 + 60));
    const [rect, t] = rectWithLabel(MARGIN, y, nw, 30 + spec.notes.length * 22, text, KIND_STYLE.note);
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
