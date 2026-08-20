/**
 * read-excalidraw.mjs — summarise a .excalidraw document as data or markdown so
 * an agent can critique a diagram without parsing raw JSON.
 *
 * Library form of the reader: summarizeExcalidraw(doc, { file? }) -> summary,
 * renderSummaryMarkdown(summary) -> string. The CLI lives in
 * scripts/read-excalidraw.mjs at the repo root (a thin shim over this module).
 *
 * Summary: a list of boxes (shapes with their labels), connections (arrows
 * with endpoints + labels), containers (large shapes enclosing others), and
 * any free-floating text. Text bound to a shape or arrow (containerId) is its
 * label; unbound text is attributed to the shape it overlaps, if any.
 * Connections and container members use the first line of a label as the name.
 */

const SHAPES = new Set(["rectangle", "ellipse", "diamond", "image", "frame"]);
const LINKS = new Set(["arrow", "line"]);

export function summarizeExcalidraw(doc, opts = {}) {
  const file = opts.file ?? "(document)";
  const els = (doc.elements ?? []).filter(e => !e.isDeleted);
  const byId = new Map(els.map(e => [e.id, e]));

  const shapes = els.filter(e => SHAPES.has(e.type));
  const arrows = els.filter(e => LINKS.has(e.type));
  const texts = els.filter(e => e.type === "text");

  const bounds = e => ({ x1: e.x, y1: e.y, x2: e.x + e.width, y2: e.y + e.height });
  const centre = e => ({ x: e.x + e.width / 2, y: e.y + e.height / 2 });
  const contains = (outer, inner) => {
    const o = bounds(outer), c = centre(inner);
    return c.x >= o.x1 && c.x <= o.x2 && c.y >= o.y1 && c.y <= o.y2;
  };
  const area = e => e.width * e.height;

  // Containers: shapes that contain >=2 other shapes' centres (computed before
  // label attribution so loose text isn't swallowed by a big group frame)
  const containerOf = new Map();
  const sortedShapes = [...shapes].sort((a, b) => area(b) - area(a));
  for (const s of sortedShapes) {
    const kids = shapes.filter(k => k !== s && contains(s, k) && area(k) < area(s));
    if (kids.length >= 2) {
      for (const k of kids) if (!containerOf.has(k.id) || area(byId.get(containerOf.get(k.id))) > area(s)) containerOf.set(k.id, s.id);
    }
  }
  const containerIds = new Set(containerOf.values());

  // Attach labels
  const labelOf = new Map(); // shape/arrow id -> [text]
  const claimed = new Set();
  const flat = t => (t.originalText ?? t.text ?? "").trim().replace(/\s*\n\s*/g, " | ");
  for (const t of texts) {
    const txt = flat(t);
    if (!txt) continue;
    if (t.containerId && byId.has(t.containerId)) {
      labelOf.set(t.containerId, [...(labelOf.get(t.containerId) ?? []), txt]);
      claimed.add(t.id);
    }
  }
  // Unbound text: attribute to the smallest non-container shape it overlaps, or
  // to a shape it sits directly beneath (a caption). Otherwise it's floating, but
  // container-frame titles (text near the top-left of a container) go to the frame.
  const overlaps = (a, b) => { const A = bounds(a), B = bounds(b); return A.x1 < B.x2 && A.x2 > B.x1 && A.y1 < B.y2 && A.y2 > B.y1; };
  for (const t of texts) {
    if (claimed.has(t.id)) continue;
    const txt = flat(t);
    if (!txt) continue;
    const leaf = shapes.filter(s => !containerIds.has(s.id) && overlaps(s, t)).sort((a, b) => area(a) - area(b))[0];
    if (leaf) { labelOf.set(leaf.id, [...(labelOf.get(leaf.id) ?? []), txt]); claimed.add(t.id); continue; }
    const caption = shapes.filter(s => !containerIds.has(s.id) && t.y >= s.y + s.height - 2 && t.y <= s.y + s.height + 30 && t.x + t.width > s.x && t.x < s.x + s.width)[0];
    if (caption) { labelOf.set(caption.id, [...(labelOf.get(caption.id) ?? []), txt]); claimed.add(t.id); continue; }
    const frame = [...containerIds].map(id => byId.get(id)).filter(c => contains(c, t) && t.y - c.y < 40).sort((a, b) => area(a) - area(b))[0];
    if (frame) { labelOf.set(frame.id, [...(labelOf.get(frame.id) ?? []), txt]); claimed.add(t.id); }
  }
  const label = e => (labelOf.get(e.id) ?? []).join(" / ") || null;

  // Give every labelled shape a short name for the report: the first line of its
  // label (the "title"); the full multi-line label is listed under Components.
  const nameOf = e => {
    const l = label(e);
    if (!l) return `<unlabelled ${e.type} @${Math.round(e.x)},${Math.round(e.y)}>`;
    const first = l.split(" | ")[0].trim();
    return first || l;
  };

  // Resolve arrow endpoints: binding first, else nearest shape to the endpoint
  function endpointShape(a, which) {
    const b = which === "start" ? a.startBinding : a.endBinding;
    if (b?.elementId && byId.has(b.elementId)) return byId.get(b.elementId);
    const pts = a.points ?? [[0, 0]];
    const p = which === "start" ? pts[0] : pts[pts.length - 1];
    const px = a.x + p[0], py = a.y + p[1];
    let best = null, bestD = Infinity;
    for (const s of shapes) {
      const bb = bounds(s);
      const dx = Math.max(bb.x1 - px, 0, px - bb.x2), dy = Math.max(bb.y1 - py, 0, py - bb.y2);
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = s; }
    }
    return bestD <= 40 ? best : null;
  }

  const nodes = shapes.filter(s => !containerIds.has(s.id)).map(s => ({
    id: s.id, type: s.type, label: label(s), x: Math.round(s.x), y: Math.round(s.y),
    container: containerOf.has(s.id) ? nameOf(byId.get(containerOf.get(s.id))) : null,
    color: s.backgroundColor,
  }));
  const containers = [...containerIds].map(id => byId.get(id)).map(c => ({
    label: label(c), members: shapes.filter(k => containerOf.get(k.id) === c.id).map(nameOf),
  }));
  const edges = arrows.map(a => {
    const s = endpointShape(a, "start"), e = endpointShape(a, "end");
    const bidir = a.startArrowhead && a.endArrowhead;
    return {
      from: s ? nameOf(s) : "?", to: e ? nameOf(e) : "?", label: label(a),
      style: a.strokeStyle, bidirectional: !!bidir, dangling: !s || !e,
    };
  });
  const floating = texts.filter(t => !claimed.has(t.id)).map(flat).filter(Boolean);

  return { file, nodes, containers, edges, floating_text: floating,
    stats: { shapes: shapes.length, arrows: arrows.length, unlabelled_shapes: nodes.filter(n => !n.label).length, dangling_arrows: edges.filter(e => e.dangling).length } };
}

export function renderSummaryMarkdown(summary) {
  const { file, nodes, containers, edges, floating_text: floating } = summary;
  const lines = [];
  lines.push(`# Diagram summary: ${file}`, "");
  lines.push(`Shapes: ${summary.stats.shapes} · Arrows: ${summary.stats.arrows} · Unlabelled shapes: ${summary.stats.unlabelled_shapes} · Dangling arrows: ${summary.stats.dangling_arrows}`, "");
  if (containers.length) {
    lines.push("## Containers / groupings");
    for (const c of containers) lines.push(`- **${c.label ?? "(unlabelled)"}**: ${c.members.join(", ")}`);
    lines.push("");
  }
  lines.push("## Components (left→right, top→bottom)");
  for (const n of [...nodes].sort((a, b) => a.x - b.x || a.y - b.y)) {
    lines.push(`- ${n.label ?? "(unlabelled " + n.type + ")"}${n.container ? ` _[in ${n.container}]_` : ""}`);
  }
  lines.push("");
  lines.push("## Connections");
  if (!edges.length) lines.push("- (none)");
  for (const e of edges) {
    const arrow = e.bidirectional ? "<->" : "->";
    lines.push(`- ${e.from} ${arrow} ${e.to}${e.label ? `  — "${e.label}"` : ""}${e.style !== "solid" ? ` (${e.style})` : ""}${e.dangling ? "  ⚠ dangling" : ""}`);
  }
  lines.push("");
  if (floating.length) {
    lines.push("## Free-floating text / notes");
    for (const f of floating) lines.push(`- ${f}`);
    lines.push("");
  }
  return lines.join("\n");
}
