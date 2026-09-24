# D&D card asset pipeline

A private ChatGPT Site for turning the repository's open `ASSET` issues into reviewable card-art pull requests.

## Workflow

1. Load open issues labeled `ASSET` from `DnD-Decks/dnd-deck-designer` and read the prompt, asset ID, card orientation, and required output path from each issue.
2. Generate four low-quality composition drafts in parallel. Each uses the issue's art direction plus one controlled composition instruction. The image API has no temperature parameter; these prompt-level directions create useful alternatives without changing the house style.
3. Keep the drafts and run metadata in the Site's private R2 bucket, so they survive reloads without putting temporary images into Git history.
4. Edit the selected draft once at high quality and the exact target aspect ratio. Previews are 480 × 672 px or 672 × 480 px. Final output is 800 × 1120 px or 1120 × 800 px. Both sizes match 5:7 or 7:5 exactly; final output exceeds the issue template's minimum dimensions.
5. After review, create a branch containing `public/art/<asset-id>.png` and open a pull request with `Closes #<issue>`. GitHub closes the issue when that pull request is merged, not when it is opened.

The Site uses a Cloudflare Worker because ChatGPT Sites run Worker ESM. The application code is JavaScript so the same source can run in that hosted environment; it does not expose API credentials to the browser.

## Site secrets

Configure these as runtime secrets in Sites. Do not commit them or place them in `.openai/hosting.json`.

| Secret | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Calls the OpenAI Images API for four low-quality previews and one high-quality edit. |
| `GITHUB_TOKEN` | Writes one image to a feature branch and opens its pull request. Use a fine-grained token restricted to `DnD-Decks/dnd-deck-designer` with Contents read/write and Pull requests read/write. |

Issue reading is public and does not use the GitHub token. Keep the Site private because it can spend from the configured OpenAI account and create repository pull requests.

Image requests use the [OpenAI image generation](https://developers.openai.com/api/reference/resources/images/methods/generate) and [image editing](https://developers.openai.com/api/reference/resources/images/methods/edit) endpoints. GPT Image 2 accepts custom dimensions divisible by 16, which makes exact 5:7 and 7:5 output possible at both draft and final sizes.

## Local checks

From this folder, run:

```sh
npm test
npm run build
npm run validate
```

The build emits the Worker Site artifact to `dist/`. No dependencies are required. Deploy with the Sites workflow after the Site is registered and both secrets are configured.

## Issue format

The parser follows the `/asset` issue template in `.claude/skills/asset/`: `## Asset ID`, the card data snapshot, a fenced `## Image-generation prompt`, and acceptance criteria naming the image path and issue number. Portrait cards use 5:7; feat cards use landscape 7:5. Issues that do not meet these checks remain visible but cannot start generation.
