// Zero-dependency test for the open-redirect guard, run with the bundled Node
// test runner (Node v24 type-strips the imported .ts on the fly):
//     node --test lib/safe-redirect.test.mjs
// Written as .mjs so it stays out of the app's tsc graph but still imports the
// real .ts source (single source of truth — no duplicated logic).

import { test } from "node:test";
import assert from "node:assert/strict";

import { safeRedirect } from "./safe-redirect.ts";

test("allows same-origin relative paths", () => {
  assert.equal(safeRedirect("/teams"), "/teams");
  assert.equal(safeRedirect("/dashboard?tab=1#x"), "/dashboard?tab=1#x");
});

test("falls back for off-site, scheme, and protocol-relative URLs", () => {
  for (const bad of ["//evil.com", "https://evil.com", "javascript:alert(1)", "/\\evil.com", "\\\\evil"]) {
    assert.equal(safeRedirect(bad), "/dashboard", `expected fallback for: ${bad}`);
  }
});

test("falls back for empty, missing, or non-rooted values", () => {
  assert.equal(safeRedirect(""), "/dashboard");
  assert.equal(safeRedirect(null), "/dashboard");
  assert.equal(safeRedirect(undefined), "/dashboard");
  assert.equal(safeRedirect("relative/path"), "/dashboard");
});

test("honours a custom fallback", () => {
  assert.equal(safeRedirect("//evil.com", "/login"), "/login");
});
