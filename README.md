# dnd-deck-designer

A static web tool for laying out custom **D&D 2024 (5.5e, SRD 5.2.1)** card decks per PHB class — screen preview and professional printing.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — vision, folder layout, data shapes, decisions log
- [CONTRIBUTING.md](CONTRIBUTING.md) — prerequisites, scripts, workflow
- [e2e/README.md](e2e/README.md) — end-to-end suite: layout, running it, snapshots

## Tech

React 19 · Vite · TypeScript · CSS Modules · pnpm · biome · vitest / node:test · Playwright (e2e)

## Data

Spell and class data sourced from the [D&D 5e 2024 SRD](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data).

> SRD 5.2 used under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) (Wizards of the Coast LLC). D&D trademarks and non-SRD content remain property of WotC.

The verbatim SRD 5.2.1 PDF (CC-BY-4.0 official release) is committed under [`reference/srd/`](reference/srd/) as an audit ground-truth. **SRD content only** — not the full PHB.

## License

`MIT AND CC-BY-4.0` — code under MIT (see [LICENSE](LICENSE)); vendored SRD 5.2.1 game content under CC-BY-4.0 (see [NOTICE](NOTICE)).
