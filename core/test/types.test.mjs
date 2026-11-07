// core/types/*.d.ts are hand-written. This keeps them honest against core/src: every value a
// declaration file exports must exist at runtime and vice versa (types are checked separately
// by `bun run types:core`, which compiles core/test/types/check.ts against the same files).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pkgUrl = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));
const read = rel => readFileSync(new URL(rel, pkgUrl), "utf8");

/** Value names (not interface/type) a .d.ts exports, following `export * from "./x.js"`. */
function declaredValues(dtsRel) {
  const src = read(dtsRel);
  const names = new Set();
  for (const m of src.matchAll(/^export declare (?:function|const|class|let|var|enum)\s+(\w+)/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^export \* from "\.\/(.+)\.js";/gm)) {
    const dir = dtsRel.slice(0, dtsRel.lastIndexOf("/") + 1);
    for (const n of declaredValues(`${dir}${m[1]}.d.ts`)) names.add(n);
  }
  return names;
}

// content/index.mjs imports .md files, which plain Node cannot load; its Node twin
// (./content/node) is declared and checked below, and content.d.ts is checked by hand-listing.
const SKIP_RUNTIME = new Set(["./content"]);

for (const [subpath, target] of Object.entries(pkg.exports)) {
  test(`exports["${subpath}"]: declared values match runtime exports`, async () => {
    const declared = declaredValues(target.types);
    assert.ok(declared.size > 0, `${target.types} declares at least one value`);
    if (SKIP_RUNTIME.has(subpath)) return;
    const runtime = new Set(Object.keys(await import(new URL(target.default, pkgUrl))));
    assert.deepEqual([...runtime].sort(), [...declared].sort());
  });
}

test("exports[./content]: declared values match the names content/index.mjs exports", () => {
  const src = read("./content/index.mjs");
  const m = src.match(/^export const \{([^}]+)\} = content;/m);
  assert.ok(m, "content/index.mjs destructures its exports from `content`");
  const runtime = m[1].split(",").map(s => s.trim()).filter(Boolean);
  assert.deepEqual(runtime.sort(), [...declaredValues("./types/content.d.ts")].sort());
});

test("every exports entry resolves to files that exist", () => {
  for (const target of Object.values(pkg.exports)) {
    for (const rel of [target.types, target.default]) assert.doesNotThrow(() => read(rel), rel);
  }
});
