# D&D card asset pipeline

A private ChatGPT Site for turning the repository's open `ASSET` issues into reviewable card-art pull requests.

## Workflow

1. Load open issues labeled `ASSET` from `DnD-Decks/dnd-deck-designer` and read the prompt, asset ID, card orientation, and required output path from each issue. On mobile, **Browse cards** opens a full-height issue list. Search and filter open issues by PR state (open, closed, or none), saved drafts (yes/no), and saved final renders (yes/no). A closed PR is a PR closed without merging while its issue remains open; merged PRs normally close their issues and no longer appear in the pending list. Existing artwork summaries are indexed from Site storage on first load and updated with each new render.
2. The issue's image-generation prompt starts collapsed; expand it to edit or brainstorm. The brainstorming chat uses GPT-5.4 Mini through the Responses API at `low` reasoning effort to discuss changes and optionally propose a complete revised prompt. Applying a proposal updates the editable prompt; chat messages remain in the browser tab's session storage, while the adopted prompt is saved with a draft run. The **Dictate** control records a short voice note and transcribes it with GPT-4o Mini Transcribe; the transcription is placed in the chat composer for review before sending. For standard asset-template issues, choose from 37 named style prompts in the deck repository’s `/asset` skill (the original painterly style is the default), and assign 1–40 drafts across them. Eight less-favored styles are archived: they remain selectable in a separate picker group. **One of each selected** sets counts to one; **Compare all active styles** prepares 29 drafts and **Compare all including archived** prepares 37. Issue selections and named presets are saved in this browser’s local storage. The app removes the old `## VISUAL STYLE` block and neutralizes illustration-specific template wording before inserting the selected style. Bespoke prompts cannot switch styles until normalized; they remain usable unchanged. Each draft of a given style receives the exact same assembled prompt. Review every assembled prompt in the app before enabling generation; the server validates that the preview signature still matches when generation starts. Each image is billed separately. Large draft runs submit up to four images per minute, with rate-limited slots retried in their original run. Keep the page open until all requests have been accepted; if you close it early, submission resumes when you return. Accepted requests continue as OpenAI Responses background jobs, and the Site retrieves, archives, and shows results when you return. A partial run offers **Retry failed drafts** without regenerating completed slots. Responses are stored by OpenAI for later retrieval (`store: true`); the Site must retrieve the output before that retention period expires. The image API has no temperature parameter. Repeating an exact prompt can produce different images, but distinct outputs are not guaranteed.
3. Automatically commit the completed drafts and a `run.json` containing the edited issue prompt, the named style and its text snapshot for each draft, and each exact candidate request prompt to the repository's default branch in `asset-pipeline/drafts/<issue-number>-<issue-title>/<run-id>/`. No PR or extra click is needed. A unique run directory preserves later attempts. The app retries a concurrent default-branch update by rebuilding on the newest tip; it never force-pushes. If GitHub rejects a write (for example, due to branch protection), the images remain in private R2 storage and the UI offers **Retry Git save**. The saved artwork gallery lists every draft session for the issue, with thumbnails of its previews and final renders; open a session to choose a candidate or a previously rendered version. Images open in a full-screen viewer with fit-to-screen and 100% resolution modes.
4. Edit the selected draft, optionally adding a short refinement instruction. Advanced render options select GPT Image 2.5 Flare (default), 2.5 Sunburst, or Image 2; quality `low`/`medium`/`high` (plus `xhigh`/`max` for 2.5), and card or large output size. Card output is 800 × 1120 px or 1120 × 800 px; large is 1200 × 1680 px or 1680 × 1200 px. The default is Flare at `medium` quality and card size. The final asset is always an opaque PNG in the exact card aspect ratio; other image formats and transparent backgrounds are deliberately excluded. Compare modes on representative cards before treating the faster one as production-equivalent. The selected preview and saved style guide the final render. The final render uses the style text saved with its draft, even if the style catalog changes later. A visible spinner and disabled button indicate a pending background render; the browser can be closed. On return, the Site retrieves the completed result, saves the full-resolution PNG in Site storage, and commits it to the same run folder on the default branch with updated `run.json`. **Render another version** preserves prior PNGs. The newest version becomes the PR candidate by default; an earlier version can be selected again from the history. If Git fails, retry from the workbench before opening a PR. Older renders created before automatic archiving can be recovered with **Save renders to Git** in their draft session. Each render is billed separately. Drafts use GPT Image 2.5 Flare at `low` quality in compressed JPEG, which favors speed and keeps permanent Git history smaller. Previews are 720 × 1008 px or 1008 × 720 px. Both sizes match 5:7 or 7:5 exactly; final output exceeds the issue template's minimum dimensions. The 720 × 1008 previews satisfy the models' 655,360-pixel minimum; the previous 480 × 672 previews did not.
5. After review, create a branch containing `public/art/<asset-id>.png` and open a pull request with `Closes #<issue>`. The PR button shows a spinner and is disabled while GitHub is working. This action is still a normal request, so keep the browser open until it completes; rerun it if interrupted. GitHub closes the issue when that pull request is merged, not when it is opened. Drafts and renders are already on the default branch.

The Site uses a Cloudflare Worker because ChatGPT Sites run Worker ESM. The application code is JavaScript so the same source can run in that hosted environment; it does not expose API credentials to the browser.

## Site secrets

Configure these as runtime secrets in Sites. Do not commit them or place them in `.openai/hosting.json`.

| Secret | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Calls the OpenAI Images API for previews and final edits, Responses API for prompt chat, and Audio Transcriptions API for voice input. |
| `GITHUB_TOKEN` | Reads the issue list and details, commits drafts directly to the default branch, writes the final image to a feature branch, and opens its pull request. Use a fine-grained token restricted to `DnD-Decks/dnd-deck-designer` with Issues read, Contents read/write, and Pull requests read/write. The default branch must allow this token to push. |

Issue reading uses the token to avoid GitHub's shared anonymous API rate limit. Keep the Site private because it can spend from the configured OpenAI account and create repository pull requests.

Image requests use the [OpenAI image generation](https://developers.openai.com/api/reference/resources/images/methods/generate) and [image editing](https://developers.openai.com/api/reference/resources/images/methods/edit) endpoints. GPT Image 2 accepts custom dimensions divisible by 16, with a minimum of 655,360 pixels, which makes exact 5:7 and 7:5 output possible at both draft and final sizes.

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
