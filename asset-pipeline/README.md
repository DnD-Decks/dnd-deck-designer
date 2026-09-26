# D&D card asset pipeline

A private ChatGPT Site for turning the repository's open `ASSET` issues into reviewable card-art pull requests.

## Workflow

1. Load open issues labeled `ASSET` from `DnD-Decks/dnd-deck-designer` and read the prompt, asset ID, card orientation, and required output path from each issue.
2. Edit the issue's image-generation prompt in the workbench, then generate four low-quality composition drafts in parallel. Each uses the edited prompt plus one controlled composition instruction. The image API has no temperature parameter; these prompt-level directions create useful alternatives without changing the house style.
3. Automatically commit the completed drafts and a `run.json` containing the exact prompt to the repository's default branch in `asset-pipeline/drafts/<issue-number>-<issue-title>/<run-id>/`. No PR or extra click is needed. A unique run directory preserves later attempts. The app retries a concurrent default-branch update by rebuilding on the newest tip; it never force-pushes. If GitHub rejects a write (for example, due to branch protection), the images remain in private R2 storage and the UI offers **Retry Git save**.
4. Edit the selected draft once at high quality, using the prompt saved with that draft run, at the exact target aspect ratio. Drafts use GPT Image 2.5 Flare at `low` quality in compressed JPEG, which favors speed and keeps the permanent Git history smaller. Previews are 720 × 1008 px or 1008 × 720 px. The final edit uses GPT Image 2 at `high` quality and outputs PNG at 800 × 1120 px or 1120 × 800 px. Both sizes match 5:7 or 7:5 exactly; final output exceeds the issue template's minimum dimensions. The 720 × 1008 previews satisfy the models' 655,360-pixel minimum; the previous 480 × 672 previews did not.
5. After review, create a branch containing `public/art/<asset-id>.png` and open a pull request with `Closes #<issue>`. GitHub closes the issue when that pull request is merged, not when it is opened. Drafts are already on the default branch.

The Site uses a Cloudflare Worker because ChatGPT Sites run Worker ESM. The application code is JavaScript so the same source can run in that hosted environment; it does not expose API credentials to the browser.

## Site secrets

Configure these as runtime secrets in Sites. Do not commit them or place them in `.openai/hosting.json`.

| Secret | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Calls the OpenAI Images API for four low-quality Flare previews and one high-quality GPT Image 2 edit. |
| `GITHUB_TOKEN` | Reads the issue list and details, commits drafts directly to the default branch, writes the final image to a feature branch, and opens its pull request. Use a fine-grained token restricted to `DnD-Decks/dnd-deck-designer` with Issues read, Contents read/write, and Pull requests read/write. The default branch must allow this token to push. |

Issue reading uses the token to avoid GitHub's shared anonymous API rate limit. Keep the Site private because it can spend from the configured OpenAI account and create repository pull requests.

Image requests use the [OpenAI image generation](https://developers.openai.com/api/reference/resources/images/methods/generate) and [image editing](https://developers.openai.com/api/reference/resources/images/methods/edit) endpoints. GPT Image 2 accepts custom dimensions divisible by 16, with a minimum of 655,360 pixels, which makes exact 5:7 and 7:5 output possible at both draft and final sizes.

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
