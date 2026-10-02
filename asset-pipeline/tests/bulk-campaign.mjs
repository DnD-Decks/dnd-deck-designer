import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";

const prompt = `# DECK BACKGROUND STYLE v2

Create a vertical fantasy illustration intended to be used purely as background artwork for a Dungeons & Dragons card deck.

## SCENE

A luminous spell in a forest.

## VISUAL STYLE

Painterly brushwork.

## COMPOSITION

The artwork is an independent fantasy illustration.
No text.

## OUTPUT

Portrait.`;

function asset(number, kind) {
  return {
    number,
    state: "open",
    title: `[asset]: Card ${number}`,
    labels: [{ name: "ASSET" }],
    body: `## Asset ID\n\n\`card-${number}\`\n\n| Kind | ${kind} |\n| Name | Card ${number} |\n| Orientation | portrait 5:7 |\n\n## Image-generation prompt\n\n\`\`\`\n${prompt}\n\`\`\`\n\nPR adds \`public/art/card-${number}.png\`\nCloses #${number}`,
  };
}

test("owner batch starts 37 styles for draftless non-weapon issues and persists progress", async () => {
  const previousFetch = globalThis.fetch;
  const storage = new Map();
  const submitted = [];
  const issues = [asset(100, "weapon"), asset(101, "spell")];
  const bucket = {
    async put(key, value) {
      storage.set(key, value);
    },
    async get(key) {
      if (!storage.has(key)) return null;
      return {
        async json() {
          return JSON.parse(storage.get(key));
        },
      };
    },
    async list({ prefix }) {
      return {
        objects: [...storage.keys()]
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ key })),
        truncated: false,
      };
    },
  };
  const reply = (value) =>
    new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/repos/DnD-Decks/dnd-deck-designer/issues") return reply(issues);
    if (path === "/repos/DnD-Decks/dnd-deck-designer/issues/101") return reply(issues[1]);
    if (path === "/v1/responses" && options.method === "POST") {
      submitted.push(JSON.parse(options.body));
      return reply({ id: `response-${submitted.length}`, status: "queued" });
    }
    throw Error(`Unexpected fetch ${path}`);
  };
  const env = {
    BUCKET: bucket,
    OPENAI_API_KEY: "mock-openai",
    GITHUB_TOKEN: "mock-github",
    PIPELINE_OWNER_EMAIL: "owner@example.com",
    BULK_SERVICE_TOKEN: "mock-service-token",
  };
  const call = async (name, email = "owner@example.com") =>
    worker.fetch(
      new Request("https://pipeline.example/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", "oai-authenticated-user-email": email },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name, arguments: {} },
        }),
      }),
      env
    );
  try {
    assert.equal((await call("draft_batch_step", "viewer@example.com")).status, 403);
    const response = await call("draft_batch_step");
    assert.equal(response.status, 200);
    const status = JSON.parse((await response.json()).result.content[0].text);
    assert.equal(status.total, 1);
    assert.equal(status.currentIssue, 101);
    assert.equal(status.submittedCount, 4);
    assert.equal(status.variantCount, 37);
    assert.equal(submitted.length, 4);
    assert.ok(storage.has("campaigns/non-weapon-37.json"));
    const read = await call("draft_batch_status");
    assert.equal(
      JSON.parse((await read.json()).result.content[0].text).currentJobId,
      status.currentJobId
    );
    const serviceStatus = await worker.fetch(
      new Request("https://pipeline.example/api/bulk/status", {
        headers: { "x-batch-token": "mock-service-token" },
      }),
      env
    );
    assert.equal(serviceStatus.status, 200);
    assert.equal((await serviceStatus.json()).currentIssue, 101);
    const rejected = await worker.fetch(
      new Request("https://pipeline.example/api/bulk/step", { method: "POST" }),
      env
    );
    assert.equal(rejected.status, 403);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
