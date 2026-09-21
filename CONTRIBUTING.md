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

## Adding a new card kind

Follow the step-by-step in `ARCHITECTURE.md` § *Adding a new card kind* (data → model → `DeckCard` union → deck assembly → `deck-view` switches → component). In short: cards live flat as `src/cards/<kind>-card.component.tsx` + CSS module + co-located test — there are no per-category folders and no barrel file.

## Adding a new class deck

Decks are data-driven — there is no per-class UI code.

1. Author `src/data/feats/<class>-feats.json` and, if the class has level-1 resources, `src/data/resources/<class>-resources.json` (follow any existing class's files — all 12 L1 decks are complete and serve as examples).
2. Register the JSON in the model's `CLASS_DATA` map: `src/models/feats/feats.model.ts` and `src/models/resources/resources.model.ts`. Spell lists work the same way via `src/data/spells/<class>-spells.json` + `src/models/spells/spells.model.ts`.
3. Verify content against `reference/srd/SRD_5.2.1.md` (D&D 2024 / 5.5e rules) and run `pnpm scripts:sync-srd-data` — no new mismatches.
4. `src/decks/deck.model.ts` assembles the deck automatically from the models; the class selector already lists all 12 classes.

## Delivering a card asset

Card art is generated outside the repo — a PR delivering an asset carries the PNG and nothing else.

1. **Pick an open issue** labelled `ASSET` — titled ``[asset]: `<name>` <kind>`` (spell, `<class>` feat, `<class>` resource or weapon mastery).
2. **Copy the prompt** from the issue body (it is written for ChatGPT, but any image tool works).
3. **Generate the image.**
4. **Save it as `public/art/<asset-id>.png`** — 5:7 portrait, ≥ 750 × 1050 px; feat cards are landscape, 7:5, ≥ 1050 × 750 px. The id and orientation are in the issue's *Asset ID* / *Card data snapshot* blocks.
5. **Open a PR** with `Closes #<issue>` in the body. One asset per PR.
6. **Run `pnpm blue-ball`** — the build must stay green.

Spell and weapon-mastery assets are **shared across classes** — `fire-bolt.png` serves both the Wizard and Sorcerer decks; never add per-class variants. Class features and resources are per class by nature (`rogue-sneak-attack`, `barbarian-rage`).

To regenerate or inspect the prompt for an asset, run the `/asset` skill (`.claude/skills/asset/`):

```
/asset <card name | id | class + name> [--dry-run]
```

It re-renders the prompt and upserts the matching issue — re-running it edits the existing one instead of opening a duplicate. `--dry-run` prints the prompt without touching GitHub; `/asset all` walks every level-1 card. Background: `ARCHITECTURE.md` § *Art assets*.
