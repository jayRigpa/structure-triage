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
  assert.match(guide, /<title>A Guide to the Terms<\/title>/);
  assert.match(guide, /<h1>A Guide to the Terms<\/h1>/);
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

test("requires the Phase 3 mapping to use well-formed Markdown structure", async () => {
  const [prompt, app, styles] = await Promise.all([
    readFile(new URL("../netlify/functions/triage-prompt.mjs", import.meta.url), "utf8"),
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(prompt, /Format the entire Phase 3 response as Markdown source text/);
  assert.match(prompt, /## Mapping/);
  assert.match(prompt, /### 1\. Primary Presenting Structure/);
  assert.match(prompt, /### 2\. Co-Presenting Structures/);
  assert.match(prompt, /### 3\. Practice Directions/);
  assert.match(prompt, /### 4\. Failure Modes/);
  assert.match(prompt, /### 5\. Limits of This Reading/);
  assert.match(prompt, /blank line before and after every heading, paragraph, and list/);
  assert.match(prompt, /Never run a heading into a paragraph or place multiple list items on one line/);
  assert.match(app, /body\.className = "body"/);
  assert.ok(
    app.includes('`**Facilitator:**\\n\\n${clean}\\n`'),
    "export must put facilitator content after a blank line so Markdown headings remain valid",
  );
  assert.match(styles, /\.msg\.facilitator \.body\s*\{[^}]*white-space:\s*pre-wrap/s);
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
  assert.match(feedback, /8\. Compared to a skilled human conducting a diagnostic intake conversation/);
  assert.doesNotMatch(feedback, /Drawing on your own training as a coach/);
  assert.match(thanks, /Thank you — this is how it gets better\./);
});
