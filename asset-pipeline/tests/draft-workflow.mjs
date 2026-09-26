import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";

function png(width, height) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function jpeg(width, height) {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0,
    7,
    8,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    0xff,
    0xd9,
  ]);
}

const issue = {
  number: 190,
  state: "open",
  title: "[asset]: `Vex` weapon mastery",
  html_url: "https://github.com/DnD-Decks/dnd-deck-designer/issues/190",
  labels: [{ name: "ASSET" }],
  body: [
    "## Asset ID",
    "",
    "`vex`",
    "",
    "## Card data snapshot",
    "| Field | Value |",
    "| --- | --- |",
    "| Kind | weapon mastery |",
    "| Name | Vex |",
    "| Orientation | portrait 5:7 |",
    "",
    "## Image-generation prompt (paste into ChatGPT)",
    "",
    "```",
    "An original painting.",
    "## OUTPUT",
    "At least 750 x 1050 px.",
    "```",
    "",
    "## Acceptance criteria",
    "- [ ] PR adds `public/art/vex.png`",
    "- [ ] PR body references `Closes #190`",
  ].join("\n"),
};

test("workbench defaults to two variants with a collapsed prompt and mobile issue menu", async () => {
  const response = await worker.fetch(new Request("https://pipeline.example/"), {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="mobile-issues-toggle"/);
  assert.match(html, /name="variant-count" value="2" checked/);
  assert.match(html, /Generate 2 drafts/);
  assert.doesNotMatch(html, /<details open>/);
  assert.match(html, /\.prompt-editor textarea,.search-box input\{font-size:16px\}/);
});

test("custom prompt produces valid previews, commits each run to the issue folder, and guides the final edit", async () => {
  const previousFetch = globalThis.fetch;
  const objects = new Map();
  const blobs = [];
  const trees = [];
  const imageRequests = [];
  const refs = [];
  let branchSha = null;
  let mainSha = "main-commit";
  let concurrentUpdate = true;
  let branchCreations = 0;
  let editPrompt = "";
  const bucket = {
    async put(key, value) {
      objects.set(key, value);
    },
    async get(key) {
      if (!objects.has(key)) return null;
      const value = objects.get(key);
      return {
        async json() {
          return JSON.parse(value);
        },
        async arrayBuffer() {
          return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
        },
      };
    },
    async list({ prefix }) {
      return {
        objects: [...objects.keys()]
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ key })),
        truncated: false,
      };
    },
  };
  const reply = (value, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: { "content-type": "application/json" },
    });
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method || "GET";
    if (path === "/v1/images/generations") {
      const params = JSON.parse(options.body);
      imageRequests.push(params);
      return reply({ data: [{ b64_json: Buffer.from(jpeg(720, 1008)).toString("base64") }] });
    }
    if (path === "/v1/images/edits") {
      editPrompt = options.body.get("prompt");
      return reply({ data: [{ b64_json: Buffer.from(png(800, 1120)).toString("base64") }] });
    }
    if (path === "/repos/DnD-Decks/dnd-deck-designer/issues/190") return reply(issue);
    if (path === "/repos/DnD-Decks/dnd-deck-designer") return reply({ default_branch: "main" });
    if (path.includes("/git/ref/heads/asset/issue-190-vex") && method === "GET")
      return branchSha
        ? reply({ object: { sha: branchSha } })
        : reply({ message: "Not Found" }, 404);
    if (path.endsWith("/git/ref/heads/main")) return reply({ object: { sha: mainSha } });
    if (path.endsWith("/git/refs") && method === "POST") {
      const payload = JSON.parse(options.body);
      refs.push(payload.ref);
      branchSha = payload.sha;
      branchCreations += 1;
      return reply({ object: { sha: branchSha } }, 201);
    }
    if (path.includes("/git/refs/heads/asset/issue-190-vex") && method === "PATCH") {
      branchSha = JSON.parse(options.body).sha;
      return reply({ object: { sha: branchSha } });
    }
    if (path.endsWith("/git/refs/heads/main") && method === "PATCH") {
      if (concurrentUpdate) {
        concurrentUpdate = false;
        mainSha = "external-commit";
        return reply({ message: "Update is not a fast forward" }, 422);
      }
      mainSha = JSON.parse(options.body).sha;
      return reply({ object: { sha: mainSha } });
    }
    if (path.includes("/git/commits/") && method === "GET")
      return reply({ tree: { sha: "parent-tree" } });
    if (path.endsWith("/git/blobs") && method === "POST") {
      const payload = JSON.parse(options.body);
      blobs.push(payload);
      return reply({ sha: `blob-${blobs.length}` }, 201);
    }
    if (path.endsWith("/git/trees") && method === "POST") {
      const payload = JSON.parse(options.body);
      trees.push(payload);
      return reply({ sha: `tree-${trees.length}` }, 201);
    }
    if (path.endsWith("/git/commits") && method === "POST")
      return reply({ sha: `commit-${trees.length}` }, 201);
    if (path.endsWith("/pulls") && method === "GET") return reply([]);
    if (path.endsWith("/pulls") && method === "POST")
      return reply(
        { html_url: "https://github.com/DnD-Decks/dnd-deck-designer/pull/999", number: 999 },
        201
      );
    throw Error(`Unexpected request: ${method} ${path}`);
  };
  try {
    const env = { GITHUB_TOKEN: "mock-token", OPENAI_API_KEY: "mock-key", BUCKET: bucket };
    const generate = async (prompt, variantCount) => {
      const response = await worker.fetch(
        new Request("https://pipeline.example/api/issues/190/generations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(variantCount == null ? { prompt } : { prompt, variantCount }),
        }),
        env
      );
      assert.equal(response.status, 200, await response.clone().text());
      return (await response.json()).run;
    };
    const first = await generate("Customized illustration with one raven.");
    assert.equal(first.candidates.length, 2);
    assert.equal(first.previewVariantCount, 2);
    assert.equal(first.prompt, "Customized illustration with one raven.");
    assert.equal(first.draftPath, "asset-pipeline/drafts/190-vex-weapon-mastery");
    assert.match(first.draftUrl, /asset-pipeline\/drafts\/190-vex-weapon-mastery/);
    assert.ok(
      imageRequests.every(
        ({ model, size, quality, output_format, prompt }) =>
          model === "gpt-image-2.5-flare" &&
          size === "720x1008" &&
          quality === "low" &&
          output_format === "jpeg" &&
          prompt.includes("one raven")
      )
    );
    assert.equal(new Set(imageRequests.slice(0, 2).map(({ prompt }) => prompt)).size, 2);
    assert.match(imageRequests[0].prompt, /No visible person or creature/);
    assert.match(imageRequests[1].prompt, /clearly defined person or creature/);
    assert.ok(first.candidates.every((candidate, index) => candidate.generationPrompt === imageRequests[index].prompt));
    assert.equal(first.draftBranch, "main");
    assert.equal(branchCreations, 0);
    assert.equal(concurrentUpdate, false);
    assert.equal(trees.length, 2);
    assert.equal(trees[0].tree.length, 3);
    assert.ok(trees[0].tree.some(({ path }) => path.endsWith(`/${first.runId}/draft-01.jpg`)));
    assert.ok(trees[0].tree.some(({ path }) => path.endsWith(`/${first.runId}/run.json`)));
    const runBlob = blobs[2];
    assert.match(
      Buffer.from(runBlob.content, "base64").toString(),
      /Customized illustration with one raven/
    );
    const savedRun = JSON.parse(Buffer.from(runBlob.content, "base64").toString());
    assert.deepEqual(savedRun.candidates.map(({ generationPrompt }) => generationPrompt), imageRequests.slice(0, 2).map(({ prompt }) => prompt));

    const second = await generate("Different illustrated scene.", 4);
    assert.equal(second.candidates.length, 4);
    assert.equal(second.previewVariantCount, 4);
    assert.equal(new Set(imageRequests.slice(2, 6).map(({ prompt }) => prompt)).size, 4);
    assert.match(imageRequests[4].prompt, /small or partly obscured humanoid silhouette/);
    assert.match(imageRequests[5].prompt, /genuinely surprising visual approach/);
    assert.equal(branchCreations, 0);
    assert.equal(second.draftBranch, first.draftBranch);
    assert.ok(trees[2].tree.some(({ path }) => path.includes(second.runId)));

    const invalidCountResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "Invalid count.", variantCount: 3 }),
      }),
      env
    );
    assert.equal(invalidCountResponse.status, 400);
    assert.match((await invalidCountResponse.json()).error, /1, 2, or 4/);

    const finalResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/finals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: first.runId, candidateId: 1 }),
      }),
      env
    );
    assert.equal(finalResponse.status, 200, await finalResponse.clone().text());
    assert.match(editPrompt, /Customized illustration with one raven/);
    assert.doesNotMatch(editPrompt, /Different illustrated scene/);
    assert.match(editPrompt, /do not add them back/);
    const prResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/pull-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: first.runId, candidateId: 1 }),
      }),
      env
    );
    assert.equal(prResponse.status, 200, await prResponse.clone().text());
    assert.equal((await prResponse.json()).final.prNumber, 999);
    assert.ok(trees.at(-1).tree.some(({ path }) => path === "public/art/vex.png"));
    assert.equal(branchCreations, 1);
    assert.deepEqual(refs, [`refs/heads/asset/issue-190-vex-${first.runId.slice(0, 8)}-c1`]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
