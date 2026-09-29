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
  const editPrompts = [];
  const backgroundResponses = new Map();
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
      editPrompts.push(editPrompt);
      return reply({ data: [{ b64_json: Buffer.from(png(800, 1120)).toString("base64") }] });
    }
    if (path === "/v1/responses") {
      const body = JSON.parse(options.body);
      if (body.background && body.tools?.[0]?.type === "image_generation") {
        assert.equal(body.store, true);
        assert.equal(body.tool_choice.type, "image_generation");
        assert.ok(["gpt-image-2.5-flare", "gpt-image-2.5-sunburst"].includes(body.tools[0].model));
        assert.ok(["low", "medium", "high"].includes(body.tools[0].quality));
        const id = `resp_${backgroundResponses.size + 1}`;
        const image =
          body.tools[0].output_format === "jpeg"
            ? jpeg(720, 1008)
            : body.tools[0].size === "1200x1680"
              ? png(1200, 1680)
              : png(800, 1120);
        backgroundResponses.set(id, {
          polls: 0,
          status: "completed",
          output: [
            { type: "image_generation_call", result: Buffer.from(image).toString("base64") },
          ],
        });
        return reply({ id, status: "queued" });
      }
      if (!body.input.some((item) => /json/i.test(item.content)))
        return reply(
          {
            error: {
              message:
                "Response input messages must contain the word 'json' in some form to use 'text.format' of type 'json_object'.",
            },
          },
          400
        );
      assert.equal(body.model, "gpt-5.4-mini");
      assert.equal(body.reasoning.effort, "low");
      assert.equal(body.store, false);
      assert.equal(body.input.at(-1).content, "Explore an effect without a caster.");
      return reply({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  reply: "Focus on the effect.",
                  proposedPrompt: "A revised card prompt.",
                }),
              },
            ],
          },
        ],
      });
    }
    if (path.startsWith("/v1/responses/") && method === "GET") {
      const result = backgroundResponses.get(path.split("/").at(-1));
      result.polls += 1;
      return reply(result.polls === 1 ? { status: "in_progress" } : result);
    }
    if (path === "/v1/audio/transcriptions") {
      assert.equal(options.body.get("model"), "gpt-4o-mini-transcribe");
      return reply({ text: "A fireball with no caster" });
    }
    if (path === "/repos/DnD-Decks/dnd-deck-designer/issues") return reply([issue]);
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
    assert.ok(
      first.candidates.every(
        (candidate, index) => candidate.generationPrompt === imageRequests[index].prompt
      )
    );
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
    assert.deepEqual(
      savedRun.candidates.map(({ generationPrompt }) => generationPrompt),
      imageRequests.slice(0, 2).map(({ prompt }) => prompt)
    );
    const listed = await worker.fetch(new Request("https://pipeline.example/api/issues"), env);
    const card = (await listed.json()).issues[0];
    assert.equal(card.hasDrafts, true);
    assert.equal(card.hasFinalRender, false);
    assert.equal(card.prStatus, "none");

    const second = await generate("Different illustrated scene.", 4);
    assert.equal(second.candidates.length, 4);
    assert.equal(second.previewVariantCount, 4);
    assert.match(imageRequests[4].prompt, /small or partly obscured humanoid silhouette/);
    assert.match(imageRequests[5].prompt, /genuinely surprising visual approach/);
    assert.equal(branchCreations, 0);
    assert.equal(second.draftBranch, first.draftBranch);
    assert.ok(trees[2].tree.some(({ path }) => path.includes(second.runId)));

    const invalidCount = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "Invalid count.", variantCount: 3 }),
      }),
      env
    );
    assert.equal(invalidCount.status, 400);

    const chatResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/brainstorm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: first.prompt,
          message: "Explore an effect without a caster.",
          history: [],
        }),
      }),
      env
    );
    assert.equal(chatResponse.status, 200);
    assert.equal((await chatResponse.json()).proposedPrompt, "A revised card prompt.");

    const audioForm = new FormData();
    audioForm.append(
      "audio",
      new Blob([new Uint8Array([1, 2])], { type: "audio/webm" }),
      "idea.webm"
    );
    const audioResponse = await worker.fetch(
      new Request("https://pipeline.example/api/transcribe", { method: "POST", body: audioForm }),
      env
    );
    assert.equal(audioResponse.status, 200);
    assert.equal((await audioResponse.json()).text, "A fireball with no caster");

    const finalResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/finals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: first.runId, candidateId: 1 }),
      }),
      env
    );
    assert.equal(finalResponse.status, 200, await finalResponse.clone().text());
    const firstFinal = (await finalResponse.json()).final;
    assert.ok(
      trees
        .at(-1)
        .tree.some(({ path }) =>
          path.endsWith(`/${first.runId}/${firstFinal.key.split("/").at(-1)}`)
        )
    );
    assert.ok(trees.at(-1).tree.some(({ path }) => path.endsWith(`/${first.runId}/run.json`)));
    assert.match(editPrompt, /Customized illustration with one raven/);
    assert.doesNotMatch(editPrompt, /Different illustrated scene/);
    assert.match(editPrompt, /do not add them back/);
    const tunedResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/finals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          runId: first.runId,
          candidateId: 1,
          tuning: "Make the blade straight.",
        }),
      }),
      env
    );
    assert.equal(tunedResponse.status, 200, await tunedResponse.clone().text());
    assert.equal(editPrompts.length, 2);
    assert.match(editPrompts[1], /Make the blade straight/);
    assert.equal((await tunedResponse.json()).run.finalVersions["1"].length, 2);
    assert.equal(
      trees.at(-1).tree.filter(({ path }) => path.includes(`/${first.runId}/final-`)).length,
      2
    );
    const storedManifest = JSON.parse(objects.get(first.manifestKey));
    assert.deepEqual(
      storedManifest.archivedFinalKeys.sort(),
      storedManifest.finalVersions["1"].map(({ key }) => key).sort()
    );
    storedManifest.archivedFinalKeys = undefined;
    objects.set(first.manifestKey, JSON.stringify(storedManifest));
    const archiveResponse = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/runs/${first.runId}/sync`, {
        method: "POST",
      }),
      env
    );
    assert.equal(archiveResponse.status, 200);
    assert.equal((await archiveResponse.json()).run.archivedFinalKeys.length, 2);
    const runsResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/runs"),
      env
    );
    const savedRuns = (await runsResponse.json()).runs;
    assert.equal(savedRuns.length, 2);
    assert.equal(savedRuns.find(({ runId }) => runId === first.runId).finalVersions["1"].length, 2);
    const restoreResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/final-selection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: first.runId, candidateId: 1, key: firstFinal.key }),
      }),
      env
    );
    assert.equal(restoreResponse.status, 200);
    assert.equal((await restoreResponse.json()).final.key, firstFinal.key);
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

    const draftJobResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "draft", prompt: "Background concept" }),
      }),
      env
    );
    assert.equal(draftJobResponse.status, 202, await draftJobResponse.clone().text());
    const draftJob = (await draftJobResponse.json()).job;
    assert.equal(JSON.parse(objects.get(`issues/190/jobs/${draftJob.id}.json`)).variantCount, 2);
    assert.equal(JSON.parse(objects.get(`issues/190/jobs/${draftJob.id}.json`)).requests.length, 2);
    const pendingDraft = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${draftJob.id}`),
      env
    );
    assert.equal((await pendingDraft.json()).job.status, "in_progress");
    const completedDraft = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${draftJob.id}`),
      env
    );
    assert.equal((await completedDraft.json()).job.status, "completed");
    const fourDrafts = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "draft", prompt: "Four concepts", variantCount: 4 }),
      }),
      env
    );
    assert.equal(fourDrafts.status, 202);
    const fourDraftJob = (await fourDrafts.json()).job;
    assert.equal(
      JSON.parse(objects.get(`issues/190/jobs/${fourDraftJob.id}.json`)).requests.length,
      4
    );
    const finalJobResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "final",
          runId: draftJob.runId,
          candidateId: 1,
          tuning: "Warmer light",
          mode: "fast",
        }),
      }),
      env
    );
    assert.equal(finalJobResponse.status, 202, await finalJobResponse.clone().text());
    const finalJob = (await finalJobResponse.json()).job;
    const pendingFinal = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${finalJob.id}`),
      env
    );
    assert.equal((await pendingFinal.json()).job.status, "in_progress");
    const completedFinal = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${finalJob.id}`),
      env
    );
    assert.equal((await completedFinal.json()).job.status, "completed");
    assert.ok(trees.at(-1).tree.some(({ path }) => path.includes(`/${draftJob.runId}/final-1-`)));
    const savedFinalManifest = JSON.parse(
      objects.get(`issues/190/runs/${draftJob.runId}/manifest.json`)
    );
    assert.equal(savedFinalManifest.finals["1"].model, "gpt-image-2.5-flare");
    assert.deepEqual(JSON.parse(objects.get("issues/190/summary.json")), {
      hasDrafts: true,
      hasFinalRender: true,
    });
    const badOptions = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "final",
          runId: draftJob.runId,
          candidateId: 1,
          model: "gpt-image-2",
          quality: "max",
        }),
      }),
      env
    );
    assert.equal(badOptions.status, 400);
    const advancedResponse = await worker.fetch(
      new Request("https://pipeline.example/api/issues/190/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "final",
          runId: draftJob.runId,
          candidateId: 1,
          model: "gpt-image-2.5-sunburst",
          quality: "high",
          size: "large",
        }),
      }),
      env
    );
    assert.equal(advancedResponse.status, 202, await advancedResponse.clone().text());
    const advancedJob = (await advancedResponse.json()).job;
    await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${advancedJob.id}`),
      env
    );
    const completedAdvanced = await worker.fetch(
      new Request(`https://pipeline.example/api/issues/190/jobs/${advancedJob.id}`),
      env
    );
    assert.equal((await completedAdvanced.json()).job.status, "completed");
    const advancedManifest = JSON.parse(
      objects.get(`issues/190/runs/${draftJob.runId}/manifest.json`)
    );
    assert.equal(advancedManifest.finals["1"].model, "gpt-image-2.5-sunburst");
    assert.equal(advancedManifest.finals["1"].quality, "high");
    assert.equal(advancedManifest.finals["1"].width, 1200);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
