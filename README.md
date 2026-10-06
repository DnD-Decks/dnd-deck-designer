# dnd-deck-designer

A mobile-first web tool for building and playing with **D&D 2024 (5.5e, SRD 5.2.1)** character card decks. Build a character on desktop, then open it on your phone at the table to track resources and spells during play.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — vision, folder layout, data shapes, decisions log
- [CONTRIBUTING.md](CONTRIBUTING.md) — prerequisites, scripts, workflow
- [e2e/README.md](e2e/README.md) — end-to-end suite: layout, running it, snapshots

## Use cases

**Play at the table (main):** Open your saved character on your phone. Tap cards to spend resources (Mana, Second Wind, etc.), rest to recover them. The app keeps your play state locally and syncs via share codes.

**Build a character:** Pick a class, choose your starting spells and weapons, name your character. The builder handles class-granted picks only; for complex characters (background feats, species traits), add cards manually from the catalog.

**Browse the catalog:** See every card a class can have — a reference for all 12 PHB classes. Cards can be selected and added to existing characters for custom builds.

## Tech

React 19 · Vite · TypeScript · CSS Modules · pnpm · biome · vitest / node:test · Playwright (e2e)

## Data

Spell and class data sourced from the [D&D 5e 2024 SRD](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data).

> SRD 5.2 used under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) (Wizards of the Coast LLC). D&D trademarks and non-SRD content remain property of WotC.

The verbatim SRD 5.2.1 PDF (CC-BY-4.0 official release) is committed under [`reference/srd/`](reference/srd/) as an audit ground-truth. **SRD content only** — not the full PHB.

## License

`MIT AND CC-BY-4.0` — code under MIT (see [LICENSE](LICENSE)); vendored SRD 5.2.1 game content under CC-BY-4.0 (see [NOTICE](NOTICE)).
