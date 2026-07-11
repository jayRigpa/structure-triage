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

test("offers an optional Phase 4 practice experiment and exposes its state", async () => {
  const prompt = await readFile(
    new URL("../netlify/functions/triage-prompt.mjs", import.meta.url),
    "utf8",
  );

  assert.match(prompt, /PROTOCOL — five phases, in order\. Never skip Phase 0\./);
  assert.match(prompt, /PHASE 4 — PRACTICE EXPERIMENT \(optional, only if the person accepts the offer\)/);
  assert.match(prompt, /Would you like to turn one of these directions into a concrete practice experiment\?/);
  assert.match(prompt, /phase=screening\|intake\|dialogue\|mapping\|experiment candidates=/);
});

test("publishes the beta feedback form and links it from the instrument", async () => {
  const [index, feedback, thanks] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/feedback.html", import.meta.url), "utf8"),
    readFile(new URL("../public/thanks.html", import.meta.url), "utf8"),
  ]);

  assert.match(index, /Beta tester\? <a href="\/feedback\.html"[^>]*>Share feedback here\.<\/a>/);
  assert.match(index, /<a href="\/feedback\.html" class="quiet"[^>]*>Feedback<\/a>/);
  assert.match(feedback, /<form name="beta-feedback"[\s\S]*data-netlify="true"/);
  assert.match(feedback, /action="\/thanks\.html"/);
  assert.match(thanks, /Thank you — this is how it gets better\./);
});
