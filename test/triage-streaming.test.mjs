import assert from "node:assert/strict";
import test from "node:test";

process.env.PROVIDER = "anthropic";
process.env.ANTHROPIC_API_KEY = "test-key";

const { default: triage } = await import("../netlify/functions/triage.mjs?streaming-test");

test("streams Anthropic text deltas to the client", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (_url, options) => {
    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.stream, true, "Anthropic requests must enable streaming");
    assert.ok(
      requestBody.max_tokens >= 3000,
      "final mappings need enough output tokens to reach the required state marker",
    );

    const encoder = new TextEncoder();
    const upstreamBody = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello "}}\n\n',
        ));
        controller.enqueue(encoder.encode(
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"world"}}\n\n',
        ));
        controller.enqueue(encoder.encode(
          'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ));
        controller.close();
      },
    });

    return new Response(upstreamBody, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    const response = await triage(new Request("https://example.test/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Map this case." }] }),
    }));

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /^text\/plain/);
    assert.equal(await response.text(), "Hello world");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
