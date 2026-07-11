import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FRAMEWORK_DOC } from "../netlify/functions/framework-doc.mjs";

test("publishes the reader terms guide and links it from the landing page", async () => {
  const [html, guide] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/terms-guide-for-readers.md", import.meta.url), "utf8"),
  ]);

  assert.match(
    html,
    /<a[^>]+href="terms-guide-for-readers\.md"[^>]*>New to the framework's vocabulary\? Read the terms guide first \(10 min\)<\/a>/,
  );
  assert.match(guide, /^# Before Your Reading: A Guide to the Terms/m);
  assert.match(guide, /\*\*The raft-clause\.\*\*/);
});

test("embeds the revised Stage 4 framework", () => {
  assert.match(FRAMEWORK_DOC, /## Endpoint Classes \(inherited from Stage 2\)/);
  assert.match(FRAMEWORK_DOC, /W — NATURALNESS/);
  assert.match(FRAMEWORK_DOC, /Attractor load/);
});
