# Contributing

## Prerequisites

- **Node ≥ 22.18** (see `engines` in `package.json`) — required for the built-in `node:test` runner executing TypeScript directly (type stripping on by default).
- **pnpm** — install with `npm i -g pnpm` or via `corepack enable`.

## Workflow

1. **Branch** off `main` for every change, however small.
2. **Run `pnpm blue-ball`** before opening a PR. No red gate, no merge.
3. **Small PRs.** One concern per PR. A PR that touches card layout, data loading, *and* a new deck composition is three PRs.
4. **Plan mode first** — see `AGENTS.md` for triggers.

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

1. **Pick an open issue** labelled `ASSET` — titled ``[asset]: `<spell>` spell``.
2. **Copy the prompt** from the issue body (it is written for ChatGPT, but any image tool works).
3. **Generate the image.**
4. **Save it as `public/art/<spell-id>.png`** — 5:7 portrait (MTG card ratio), ≥ 750 × 1050 px. The id is in the issue's *Asset ID* block.
5. **Open a PR** with `Closes #<issue>` in the body. One spell per PR.
6. **Run `pnpm blue-ball`** — the build must stay green.

Asset identity is **per spell, shared across classes** — `fire-bolt.png` serves both the Wizard and Sorcerer decks. Never add per-class variants.

To regenerate or inspect the prompt for an asset, run the `/asset` skill (`.claude/skills/asset/`):

```
/asset <spell name>
```

It re-renders the prompt and upserts the matching issue — re-running it edits the existing one instead of opening a duplicate. Background: `ARCHITECTURE.md` § *Art assets*.
