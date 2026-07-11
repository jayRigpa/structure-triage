import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../public/terms-guide-for-readers.md", import.meta.url);
const destination = new URL("../public/terms-guide-for-readers.html", import.meta.url);
const markdown = await readFile(source, "utf8");

function inline(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// A bold term at the beginning of a source line starts a new definition. This
// preserves the guide's compact Markdown while giving each term breathing room.
const blocks = markdown.trim().split(/\n\s*\n|\n(?=\*\*)/);
const article = blocks.map((block) => {
  const text = block.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (text === "---") return "<hr />";
  const heading = text.match(/^(#{1,2})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    return `<h${level}>${inline(heading[2])}</h${level}>`;
  }
  return `<p>${inline(text)}</p>`;
}).join("\n      ");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="A reader-friendly guide to the vocabulary used by the Presenting Structure practice triage instrument." />
  <title>Before Your Reading: A Guide to the Terms</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html { font-size: 16px; }
    body {
      margin: 0;
      background: #fff;
      color: #171717;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 18px;
      line-height: 1.72;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    main {
      width: min(100% - 40px, 850px);
      margin: 0 auto;
      padding: 64px 0 96px;
    }
    nav { margin-bottom: 34px; }
    nav a {
      color: #555;
      font-size: 14px;
      text-decoration: none;
    }
    nav a:hover { color: #111; text-decoration: underline; text-underline-offset: 3px; }
    h1, h2 { color: #171717; letter-spacing: -0.025em; }
    h1 {
      margin: 0 0 28px;
      font-size: clamp(2rem, 5vw, 2.65rem);
      line-height: 1.15;
      font-weight: 650;
    }
    h2 {
      margin: 42px 0 14px;
      font-size: 1.35rem;
      line-height: 1.35;
      font-weight: 650;
    }
    p { margin: 0 0 22px; }
    strong { font-weight: 650; }
    em { font-style: italic; }
    hr {
      border: 0;
      border-top: 1px solid #e5e5e5;
      margin: 42px 0 0;
    }
    @media (max-width: 600px) {
      body { font-size: 17px; line-height: 1.68; }
      main { width: min(100% - 32px, 850px); padding: 28px 0 64px; }
      nav { margin-bottom: 26px; }
      h1 { margin-bottom: 24px; }
      h2 { margin-top: 34px; }
    }
  </style>
</head>
<body>
  <main>
    <nav aria-label="Return to assessment"><a href="/">← Back to the practice assessment instrument</a></nav>
    <article>
      ${article}
    </article>
  </main>
</body>
</html>
`;

await writeFile(destination, html);
