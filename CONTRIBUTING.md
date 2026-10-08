# Contributing

## Prerequisites

- **Node ≥ 22.18** (see `engines` in `package.json`) — required for the built-in `node:test` runner executing TypeScript directly (type stripping on by default).
- **pnpm** — install with `npm i -g pnpm` or via `corepack enable`.
- **Docker** — only for the e2e suite: snapshot baselines are generated in the pinned Playwright image, never on the host.

## Workflow

1. **Branch** off `main` for every change, however small.
2. **Run `pnpm blue-ball`** before opening a PR. No red gate, no merge.
3. **Run `pnpm e2e`** when the change touches the UI. It starts vite itself; `pnpm e2e:docker` runs the same suite in the pinned Playwright image — the same image CI uses, and the only place snapshot baselines may be generated. See [e2e/README.md](e2e/README.md).
4. **Small PRs.** One concern per PR. A PR that touches card layout, data loading, *and* a new deck composition is three PRs.
5. **Plan mode first** — see `AGENTS.md` for triggers.

## Agent-ready issues

Issues opened with the **Agent task** form can be handed to an AI coding agent. A human applies the `agent-ready` label once the issue meets the definition of ready:

- No open questions or undecided design.
- Every acceptance criterion is testable.
- Touchpoints (`src/...` paths) are listed.
- Out of scope is stated.
- No overlap with another in-flight `agent-ready` issue on the same files.

Workflow: one issue → one branch `<type>/<issue#>-<slug>` (e.g. `feat/42-short-rest`) → one PR whose body references the issue (`Part of #N` or `Closes #N`). `pnpm blue-ball` and `pnpm e2e` must pass before the PR is opened. Visual baselines are refreshed by a human only. A human reviews every PR.

## Adding a new card kind

Follow the step-by-step in `ARCHITECTURE.md` § *Adding a new card kind* (data → model → `DeckCard` union → deck assembly → `deck-view` switches → component). In short: cards live flat as `src/cards/<kind>-card.component.tsx` + CSS module + co-located test — there are no per-category folders and no barrel file.

## Adding a new class deck

Decks are data-driven — there is no per-class UI code.

1. Author `src/data/feats/<class>-feats.json` and, if the class has level-1 resources, `src/data/resources/<class>-resources.json` (follow any existing class's files — all 12 L1 decks are complete and serve as examples).
2. Register the JSON in the model's `CLASS_DATA` map: `src/models/feats/feats.model.ts` and `src/models/resources/resources.model.ts`. Spell lists work the same way via `src/data/spells/<class>-spells.json` + `src/models/spells/spells.model.ts`.
3. Verify content against `reference/srd/SRD_5.2.1.md` (D&D 2024 / 5.5e rules) and run `pnpm scripts:sync-srd-data` — no new mismatches.
4. `src/decks/deck.model.ts` assembles the deck automatically from the models; the class selector already lists all 12 classes.

## Delivering a card asset

The asset pipeline can submit a selected draft JPEG directly. A PR delivering an asset carries the image and nothing else.

1. **Pick an open issue** labelled `ASSET` — titled ``[asset]: `<name>` <kind>``.
2. **Copy the prompt** from the issue body (written for ChatGPT; any image tool works).
3. **Generate the image.**
4. **Save a pipeline draft as `public/art/<asset-id>.jpg`.** Drafts are 720 × 1008 px portrait or 1008 × 720 px landscape. Existing PNG artwork remains supported. Older issue bodies may still specify a larger PNG; the draft pipeline's JPEG path and dimensions supersede those image requirements.
5. **Open a PR** with `Closes #<issue>` in the body. One asset per PR.
6. **Run `pnpm blue-ball`** — the build must stay green.

Which cards share art across classes, and why, is in `ARCHITECTURE.md` § *Art assets*.

To inspect or regenerate a prompt, run the `/asset` skill (`.claude/skills/asset/`):

```
/asset <card name | id | class + name> [--dry-run]
```

It re-renders the prompt and creates or updates the matching issue, never a duplicate. `--dry-run` prints the prompt without touching GitHub. `/asset all` walks every level-1 card.
