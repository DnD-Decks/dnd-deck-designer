import assert from "node:assert/strict";
import test from "node:test";
import worker, {
  applyVisualStyle,
  canSwapVisualStyle,
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
  assert.equal(1008 / 720, 7 / 5);
  assert.ok(1008 * 720 >= 655360);
});

test("draft output preserves the exact card aspect ratio", () => {
  assert.deepEqual(previewDimensions("portrait"), { width: 720, height: 1008 });
  assert.equal(720 / 1008, 5 / 7);
  assert.ok(720 * 1008 >= 655360);
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
  assert.match(html, /Generate 2 drafts/);
  assert.match(html, /Compare all active styles/);
  assert.match(html, /Compare all including archived/);
  assert.match(html, /id="preset-list"/);
  assert.match(html, /id="style-rows"/);
  assert.match(html, /Edit the issue prompt before generating drafts/);
  assert.match(html, /<dialog class="image-dialog"/);
  assert.match(html, /View at 100%/);
  assert.match(html, /Editing in background…/);
  assert.match(html, /Creating pull request…/);
  assert.doesNotMatch(html, /Advanced render options/);
  assert.doesNotMatch(html, /Render final image/);
  assert.doesNotMatch(html, /class="prompt-toggle"><details open>/);
  assert.match(html, /id="mobile-open"/);
  assert.match(html, /id="filter-pr"/);
  assert.match(html, /copy\.append\(heading, para, tuning, actions, progress, dimensions\)/);
  assert.match(html, /Brainstorm the prompt/);
  assert.match(html, /Dictate/);
  assert.match(html, /Optional edit prompt/);
  assert.ok(client);
  assert.doesNotThrow(() => new Function(client));
});

test("style substitution strips the legacy block and neutralizes its illustration shell", async () => {
  const original =
    "# DECK BACKGROUND STYLE v2\n\nCreate a vertical fantasy illustration intended to be used purely as background artwork for a Dungeons & Dragons card deck.\n\n## SCENE\n\nA blade sweeps past.\n\n## VISUAL STYLE\n\nOld painterly prose.\n\n## COMPOSITION\n\nThe artwork is an independent fantasy illustration.\nNo text.\n\n## OUTPUT\n\nPortrait.";
  assert.equal(canSwapVisualStyle(original), true);
  const replaced = applyVisualStyle(original, "Ink and ivory.");
  assert.match(replaced, /## SCENE\n\nA blade sweeps past/);
  assert.match(replaced, /## VISUAL STYLE\n\nInk and ivory/);
  assert.doesNotMatch(replaced, /Old painterly prose/);
  assert.doesNotMatch(replaced, /fantasy illustration/);
  assert.match(replaced, /background image/);
  assert.match(replaced, /## COMPOSITION\n\nThe image is independent background artwork/);
  const custom = "## Shared visual language\n\nPainterly nebula.\n\n## OUTPUT\n\nPortrait.";
  assert.equal(canSwapVisualStyle(custom), false);
  assert.throws(() => applyVisualStyle(custom, "Thread and fabric."), /custom visual instructions/);
  assert.equal(applyVisualStyle(original, null), original);
  const response = await worker.fetch(new Request("https://pipeline.example/api/styles"), {});
  const styles = (await response.json()).styles;
  assert.equal(styles.length, 37);
  assert.equal(styles.filter(({ archived }) => archived).length, 8);
  assert.equal(styles.filter(({ archived }) => !archived).length, 29);
  assert.ok(
    styles.some(
      ({ name, family, archived }) =>
        name === "Ink & Ivory" && family === "Engraved Print" && archived
    )
  );
  assert.ok(
    styles.some(
      ({ name, family, archived }) =>
        name === "Cut Lines" && family === "Engraved Print" && !archived
    )
  );
  assert.ok(styles.some(({ family }) => family === "Thermal Imaging"));
});

test("issue list and detail requests use the configured GitHub token", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    requests.push({ path, authorization: options.headers.get("authorization") });
    return new Response(
      JSON.stringify(
        path.endsWith("/99")
          ? issue()
          : path.endsWith("/pulls")
            ? [{ state: "open", head: { ref: "asset/issue-99-thunderwave" } }]
            : [issue()]
      ),
      {
        headers: { "content-type": "application/json" },
      }
    );
  };
  try {
    const env = { GITHUB_TOKEN: "test-token" };
    const list = await worker.fetch(new Request("https://pipeline.example/api/issues"), env);
    assert.equal(list.status, 200);
    const listed = (await list.json()).issues[0];
    assert.equal(listed.assetId, "thunderwave");
    assert.equal(listed.prStatus, "open");

    const detail = await worker.fetch(new Request("https://pipeline.example/api/issues/99"), env);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).number, 99);

    assert.deepEqual(requests, [
      {
        path: "/repos/DnD-Decks/dnd-deck-designer/issues",
        authorization: "Bearer test-token",
      },
      {
        path: "/repos/DnD-Decks/dnd-deck-designer/pulls",
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
