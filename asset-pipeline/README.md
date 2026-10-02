# D&D card asset pipeline

A private ChatGPT Site for turning the repository's open `ASSET` issues into reviewable card-art pull requests.

## Workflow

1. Load open issues labelled `ASSET` and read the prompt, card orientation, and asset ID. Search and filter by PR state, saved drafts, and edited drafts. The prompt editor starts collapsed and includes a persistent brainstorming chat and voice dictation.
2. Choose visual styles and draft counts, review exact prompts, then generate compressed JPEG drafts with GPT Image 2.5 Flare at `low` quality. Portrait output is 720 × 1008 px; landscape is 1008 × 720 px. Draft jobs run in the background and can be reviewed on return. Each generated image is billed separately.
3. Every completed draft run is automatically committed to `asset-pipeline/drafts/<issue-number>-<issue-title>/<run-id>/` on the repository's default branch with a `run.json` containing prompts. The app retries concurrent updates without force-pushing. If GitHub rejects a write, the images remain in Site storage and the UI offers a retry. The gallery also shows older archived renders, but there is no final-render workflow.
4. Select a draft and inspect it at full resolution. Submit it directly, or enter an optional edit prompt to generate another image from that draft. Edits use the same model, size, low quality, and JPEG compression as drafts. Each edit is archived in the same run folder and requires review and explicit selection before submission. You may close the browser while an accepted image request runs and return to review the result.
5. Submitting the selected draft or edit opens a pull request containing `public/art/<asset-id>.jpg`, with the exact image-generation prompt in a PR comment and `Closes #<issue>` in the PR body. Existing PNG artwork remains supported by the card renderer; older issue templates specifying a larger PNG are superseded by this JPEG workflow. The button shows progress. GitHub closes the issue when the PR is merged, not when it is opened.

The Site uses a Cloudflare Worker because ChatGPT Sites run Worker ESM. The application code is JavaScript so the same source can run in that hosted environment; it does not expose API credentials to the browser.

## Site secrets

Configure these as runtime secrets in Sites. Do not commit them or place them in `.openai/hosting.json`.

| Secret | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Calls the OpenAI Images API for drafts and low quality edits, Responses API for prompt chat, and Audio Transcriptions API for voice input. |
| `GITHUB_TOKEN` | Reads the issue list and details, commits drafts directly to the default branch, writes the selected draft to a feature branch, and opens its pull request. Use a fine-grained token restricted to `DnD-Decks/dnd-deck-designer` with Issues read, Contents read/write, and Pull requests read/write. The default branch must allow this token to push. |

Issue reading uses the token to avoid GitHub's shared anonymous API rate limit. Keep the Site private because it can spend from the configured OpenAI account and create repository pull requests.

Image requests use the OpenAI image generation tool through the Responses API for background jobs. Drafts and edits use the same 720 × 1008 or 1008 × 720 JPEG settings.

## Local checks

From this folder, run:

```sh
npm run styles  # regenerate the Worker catalog after editing style files
npm test
npm run build
npm run validate
```

The build checks the generated style catalog and emits a single-file Worker Site artifact to `dist/`. No dependencies are required. Deploy with the Sites workflow after the Site is registered and both secrets are configured.

## Issue format

The parser follows the `/asset` issue template in the deck repository’s `/asset` skill: `## Asset ID`, the card data snapshot, a fenced `## Image-generation prompt`, and acceptance criteria naming the image path and issue number. Portrait cards use 5:7; feat cards use landscape 7:5. Issues that do not meet these checks remain visible but cannot start generation.
