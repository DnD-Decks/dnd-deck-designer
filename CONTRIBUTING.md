# Contributing

## Prerequisites

- **Node ≥ 22** — required for the built-in `node:test` runner and native `fetch`.
- **pnpm** — install with `npm i -g pnpm` or via `corepack enable`.

## Workflow

1. **Branch** off `main` for every change, however small.
2. **Run `pnpm blue-ball`** before opening a PR. No red gate, no merge.
3. **Small PRs.** One concern per PR. A PR that touches card layout, data loading, *and* a new deck composition is three PRs.
4. **Plan mode first** — see `AGENTS.md` for triggers.

## Adding a new card category

1. Create `src/cards/<CategoryName>/` with component + CSS module + test.
2. Export from `src/cards/index.ts`.
3. Document the new category in `ARCHITECTURE.md` (Cards table).

## Adding a new class deck

1. Create `src/decks/<class>/index.tsx`.
2. Import the relevant cards and the class data from `src/data/`.
3. Register the deck in the top-level deck router.
