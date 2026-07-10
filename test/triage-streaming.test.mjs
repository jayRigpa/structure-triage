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
        setTimeout(() => {
          controller.enqueue(encoder.encode(
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"world"}}\n\n',
          ));
          controller.enqueue(encoder.encode(
            'event: message_stop\ndata: {"type":"message_stop"}\n\n',
          ));
          controller.close();
        }, 100);
      },
    });

    return new Response(upstreamBody, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    const responsePromise = triage(new Request("https://example.test/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Map this case." }] }),
    }));
    const response = await Promise.race([
      responsePromise,
      new Promise((_, reject) => setTimeout(
        () => reject(new Error("handler buffered the upstream response instead of streaming")),
        50,
      )),
    ]);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /^text\/plain/);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const first = await reader.read();
    assert.equal(decoder.decode(first.value), "Hello ");
    assert.equal(first.done, false, "first delta must arrive before the stream closes");

    let remainder = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      remainder += decoder.decode(value, { stream: true });
    }
    remainder += decoder.decode();
    assert.equal(remainder, "world");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
