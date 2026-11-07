// The path-traversal guard behind every repo read/write in the workbench API.
import assert from "node:assert/strict";
import { test } from "node:test";

import { PathOutsideRootError, resolveInside } from "../server/utils/safe-path";

const ROOT = "/srv/repo";
const escapes = (...parts: string[]) => assert.throws(() => resolveInside(ROOT, ...parts), PathOutsideRootError);

test("normal paths resolve inside the root", () => {
  assert.equal(resolveInside(ROOT, "sessions", "2026-01-01-acme-feed", "notes.md"), "/srv/repo/sessions/2026-01-01-acme-feed/notes.md");
  assert.equal(resolveInside(ROOT, "a/b/../c.md"), "/srv/repo/a/c.md");
});

test("the root itself is allowed", () => {
  assert.equal(resolveInside(ROOT), ROOT);
  assert.equal(resolveInside(ROOT, "."), ROOT);
  assert.equal(resolveInside(ROOT, "sub", ".."), ROOT);
});

test("../ traversal is refused, in one part or across parts", () => {
  escapes("..");
  escapes("../etc/passwd");
  escapes("sessions", "..", "..", "etc");
  escapes("a/../../b");
});

test("absolute paths are refused (resolve would otherwise discard the root)", () => {
  escapes("/etc/passwd");
  escapes("sessions", "/etc/passwd");
});

test("a sibling directory sharing the root's prefix is refused", () => {
  escapes("../repo-evil/secret");
  escapes("../repository");
});

test("percent-encoded traversal is not decoded here, so it stays a literal file name inside the root", () => {
  // Decoding is the HTTP layer's job; if a caller ever decodes before this call, ../ is caught above.
  assert.equal(resolveInside(ROOT, "%2e%2e/etc"), "/srv/repo/%2e%2e/etc");
  escapes(decodeURIComponent("%2e%2e%2fetc"));
  escapes(decodeURIComponent("..%2F..%2Fetc"));
});

test("a backslash is an ordinary character on POSIX, not a separator", () => {
  assert.equal(resolveInside(ROOT, "..\\etc"), "/srv/repo/..\\etc");
});
