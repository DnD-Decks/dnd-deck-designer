import assert from "node:assert/strict";
import test from "node:test";
import worker, {
  finalDimensions,
  parseAssetIssue,
  previewDimensions,
  promptForDimensions,
} from "../worker/index.js";

function issue({
  number = 99,
  orientation = "portrait 5:7",
  id = "thunderwave",
  path,
  closeNumber = number,
} = {}) {
  const outputPath = path || `public/art/${id}.png`;
  return {
    number,
    state: "open",
    title: "[asset]: `Thunderwave` spell",
    html_url: `https://github.com/DnD-Decks/dnd-deck-designer/issues/${number}`,
    labels: [{ name: "ASSET" }],
    body: [
      "## Asset ID",
      "",
      `\`${id}\``,
      "",
      "## Card data snapshot",
      "",
      "| Field | Value |",
      "| --- | --- |",
      "| Kind | spell |",
      "| Name | Thunderwave |",
      "| School | Evocation |",
      "| Level | 1 |",
      `| Orientation | ${orientation} |`,
      "",
      "## Image-generation prompt (paste into ChatGPT)",
      "",
      "```",
      "# DECK BACKGROUND STYLE v2",
      "",
      "Create a fantasy illustration.",
      "",
      "## OUTPUT",
      "",
      orientation === "landscape 7:5"
        ? "Horizontal 7:5 portrait aspect ratio."
        : "Vertical 5:7 portrait aspect ratio.",
      "At least 750 x 1050 px.",
      "```",
      "",
      "## Acceptance criteria",
      "",
      `- [ ] PR adds \`${outputPath}\` — correct dimensions`,
      `- [ ] PR body references \`Closes #${closeNumber}\``,
    ].join("\n"),
  };
}

test("parses an open portrait asset issue and validates its output path", () => {
  const parsed = parseAssetIssue(issue());
  assert.equal(parsed.number, 99);
  assert.equal(parsed.assetId, "thunderwave");
  assert.equal(parsed.kind, "spell");
  assert.equal(parsed.orientation, "portrait");
  assert.equal(parsed.orientationLabel, "Portrait 5:7");
  assert.equal(parsed.targetPath, "public/art/thunderwave.png");
  assert.match(parsed.prompt, /DECK BACKGROUND STYLE v2/);
  assert.equal(parsed.ready, true);
});

test("supports landscape feat cards and exact 7:5 dimensions", () => {
  const parsed = parseAssetIssue(
    issue({ number: 42, id: "rogue-sneak-attack", orientation: "landscape 7:5" })
  );
  assert.equal(parsed.orientation, "landscape");
  assert.deepEqual(previewDimensions(parsed.orientation), { width: 1008, height: 720 });
  assert.deepEqual(finalDimensions(parsed.orientation), { width: 1120, height: 800 });
  assert.equal(1008 / 720, 7 / 5);
  assert.ok(1008 * 720 >= 655360);
  assert.ok(1120 >= 1050 && 800 >= 750);
});

test("portrait image sizes match exact 5:7 and satisfy the issue minimum", () => {
  assert.deepEqual(previewDimensions("portrait"), { width: 720, height: 1008 });
  assert.deepEqual(finalDimensions("portrait"), { width: 800, height: 1120 });
  assert.equal(720 / 1008, 5 / 7);
  assert.ok(720 * 1008 >= 655360);
  assert.equal(800 / 1120, 5 / 7);
  assert.ok(800 >= 750 && 1120 >= 1050);
});

test("rejects unsafe or inconsistent output paths and a mismatched close reference", () => {
  const parsed = parseAssetIssue(issue({ path: "public/art/other-card.png", closeNumber: 98 }));
  assert.equal(parsed.ready, false);
  assert.ok(parsed.errors.some((message) => message.includes("does not match the Asset ID")));
  assert.ok(parsed.errors.some((message) => message.includes("does not match this issue")));
});

test("replaces the prompt output block with the requested pixels and composition direction", () => {
  const prompt = promptForDimensions(
    "## SCENE\nA scene.\n\n## SELECTED PREVIEW\n\nKeep its composition.\n\n## OUTPUT\n\nAt least 750 x 1050 px.",
    720,
    1008,
    "Place the action centrally."
  );
  assert.match(prompt, /720 × 1008 pixels/);
  assert.match(prompt, /Keep its composition\./);
  assert.match(prompt, /Place the action centrally\./);
  assert.doesNotMatch(prompt, /At least 750 x 1050 px/);
});

test("home page returns a complete, syntactically valid inline client script", async () => {
  const response = await worker.fetch(new Request("https://pipeline.example/"), {});
  const html = await response.text();
  const client = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.equal(response.status, 200);
  assert.match(html, /Generate four drafts/);
  assert.match(html, /Edit the issue prompt before generating drafts/);
  assert.ok(client);
  assert.doesNotThrow(() => new Function(client));
});

test("issue list and detail requests use the configured GitHub token", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    requests.push({ path, authorization: options.headers.get("authorization") });
    return new Response(JSON.stringify(path.endsWith("/99") ? issue() : [issue()]), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const env = { GITHUB_TOKEN: "test-token" };
    const list = await worker.fetch(new Request("https://pipeline.example/api/issues"), env);
    assert.equal(list.status, 200);
    assert.equal((await list.json()).issues[0].assetId, "thunderwave");

    const detail = await worker.fetch(new Request("https://pipeline.example/api/issues/99"), env);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).number, 99);

    assert.deepEqual(requests, [
      {
        path: "/repos/DnD-Decks/dnd-deck-designer/issues",
        authorization: "Bearer test-token",
      },
      {
        path: "/repos/DnD-Decks/dnd-deck-designer/issues/99",
        authorization: "Bearer test-token",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
