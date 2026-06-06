# Contributing

## Prerequisites

- **Node ≥ 22** — required for the built-in `node:test` runner and native `fetch`.
- **pnpm** — install with `npm i -g pnpm` or via `corepack enable`.

## Scripts

> These scripts are defined here as the intended contract. They will be wired in `package.json` when the project skeleton lands.

| Script | Command | What it does |
|---|---|---|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview the production build locally |
| `lint` | `biome check .` | Lint + type-check |
| `format` | `biome format . --write` | Auto-format |
| `test` | `node --test` | Run all `*.test.ts` / `*.test.tsx` files |
| `blue-ball` | lint → test → build | Full CI gate; run before every push |

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
