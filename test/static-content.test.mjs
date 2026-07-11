import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FRAMEWORK_DOC } from "../netlify/functions/framework-doc.mjs";

test("publishes the formatted reader terms guide and links it from the landing page", async () => {
  const [html, guide, source] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/terms-guide-for-readers.html", import.meta.url), "utf8"),
    readFile(new URL("../public/terms-guide-for-readers.md", import.meta.url), "utf8"),
  ]);

  assert.match(
    html,
    /<a[^>]+href="terms-guide-for-readers\.html"[^>]*>New to the framework's vocabulary\? Read the terms guide first \(10 min\)<\/a>/,
  );
  assert.match(source, /^# Before Your Reading: A Guide to the Terms/m);
  assert.match(guide, /<h1>Before Your Reading: A Guide to the Terms<\/h1>/);
  assert.match(guide, /<strong>The raft-clause\.<\/strong>/);
  assert.match(guide, /width: min\(100% - 40px, 850px\)/);
});

test("embeds the revised Stage 4 framework", () => {
  assert.match(FRAMEWORK_DOC, /## Endpoint Classes \(inherited from Stage 2\)/);
  assert.match(FRAMEWORK_DOC, /W — NATURALNESS/);
  assert.match(FRAMEWORK_DOC, /Attractor load/);
});
