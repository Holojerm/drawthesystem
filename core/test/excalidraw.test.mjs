// Assertions on the generator and reader (the check script only smoke-tests their exit codes).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildExcalidraw, renderSummaryMarkdown, summarizeExcalidraw } from "../src/index.mjs";

const spec = JSON.parse(readFileSync(new URL("../../examples/sample-spec.json", import.meta.url), "utf8"));
const firstLine = s => String(s).split("\n")[0];
const count = (doc, type) => doc.elements.filter(e => e.type === type).length;

test("generator: document envelope and element counts for the sample spec", () => {
  const doc = buildExcalidraw(spec);
  assert.equal(doc.type, "excalidraw");
  assert.equal(doc.version, 2);
  assert.equal(count(doc, "arrow"), spec.edges.length);
  // 8 nodes + 1 group frame + 1 notes box
  assert.equal(count(doc, "rectangle"), spec.nodes.length + spec.groups.length + 1);
  assert.ok(count(doc, "text") >= spec.nodes.length + spec.edges.filter(e => e.label).length);
  const ids = doc.elements.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, "element ids are unique");
});

test("generator: every arrow is bound to two existing shapes that list it back", () => {
  const doc = buildExcalidraw(spec);
  const byId = new Map(doc.elements.map(e => [e.id, e]));
  for (const arrow of doc.elements.filter(e => e.type === "arrow")) {
    for (const end of [arrow.startBinding, arrow.endBinding]) {
      assert.ok(end, "arrow has both bindings");
      const shape = byId.get(end.elementId);
      assert.ok(shape, "binding targets an existing element");
      assert.ok(
        shape.boundElements.some(b => b.id === arrow.id && b.type === "arrow"),
        "shape lists the arrow in boundElements",
      );
    }
  }
});

test("generator: edge labels and dashed style survive", () => {
  const doc = buildExcalidraw(spec);
  const async_ = doc.elements.find(e => e.type === "arrow" && e.strokeStyle === "dashed");
  assert.ok(async_, "the style:dashed edge renders dashed");
  const texts = doc.elements.filter(e => e.type === "text").map(e => e.text);
  for (const e of spec.edges.filter(e => e.label)) assert.ok(texts.includes(e.label), `label ${e.label}`);
});

test("generator: edges to unknown nodes are not silently turned into bound arrows", () => {
  const doc = buildExcalidraw({ nodes: [{ id: "a" }], edges: [{ from: "a", to: "ghost" }] });
  assert.equal(count(doc, "arrow"), 0);
});

test("reader: summary stats and structure for the generated sample", () => {
  const summary = summarizeExcalidraw(buildExcalidraw(spec), { file: "sample" });
  assert.equal(summary.file, "sample");
  assert.deepEqual(summary.stats, { shapes: 10, arrows: 8, unlabelled_shapes: 0, dangling_arrows: 0 });
  assert.deepEqual(summary.containers, [{ label: "Core", members: ["API Service", "Redis", "Postgres"] }]);
  assert.deepEqual(summary.floating_text, [spec.title]);
});

test("round trip: spec -> excalidraw -> summary recovers nodes and edges", () => {
  const summary = summarizeExcalidraw(buildExcalidraw(spec));
  const labels = new Set(summary.nodes.map(n => n.label.split(" | ")[0]));
  for (const n of spec.nodes) assert.ok(labels.has(firstLine(n.label ?? n.id)), `node ${n.id}`);

  const name = id => firstLine(spec.nodes.find(n => n.id === id).label ?? id);
  const want = spec.edges.map(e => [name(e.from), name(e.to), e.label ?? null, e.style ?? "solid"]);
  const got = summary.edges.map(e => [e.from, e.to, e.label, e.style]);
  assert.deepEqual(got.sort(), want.sort());
  assert.ok(summary.edges.every(e => !e.dangling && !e.bidirectional));
});

test("reader: flags a dangling arrow and an unlabelled shape; ignores deleted elements", () => {
  const doc = buildExcalidraw({ nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }], edges: [{ from: "a", to: "b" }] });
  const arrow = doc.elements.find(e => e.type === "arrow");
  arrow.endBinding = null;
  arrow.points = [[0, 0], [5000, 5000]]; // ends nowhere near a shape, so no nearest-shape fallback
  doc.elements.push({ ...doc.elements.find(e => e.type === "rectangle"), id: "bare", isDeleted: false, boundElements: [] });
  const s = summarizeExcalidraw(doc);
  assert.equal(s.stats.dangling_arrows, 1);
  assert.equal(s.stats.unlabelled_shapes, 1);
  doc.elements.find(e => e.id === "bare").isDeleted = true;
  assert.equal(summarizeExcalidraw(doc).stats.unlabelled_shapes, 0);
});

test("reader: markdown report mentions the counts and every node", () => {
  const md = renderSummaryMarkdown(summarizeExcalidraw(buildExcalidraw(spec)));
  assert.match(md, /Shapes: 10 · Arrows: 8 · Unlabelled shapes: 0 · Dangling arrows: 0/);
  for (const n of spec.nodes) assert.ok(md.includes(firstLine(n.label ?? n.id)), n.id);
});
