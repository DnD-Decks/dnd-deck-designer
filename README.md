# dnd-deck-creator

> **Status: scaffolding** — project skeleton and data import not yet wired.

A tool for laying out ("maquetar") custom **D&D 5.5 (2024)** card decks per PHB class — designed for screen preview and professional printing.

Each deck covers one class (lvl 1–4) in MTG-style cards:

- **Spell-slot cards** — one per available slot level (your mana pool)
- **Class-feature cards** — one per named ability (e.g. Arcane Recovery, Rage)
- **Spell cards** — one per spell in the class list (players pull their spells, return the rest)
- **Companion-stat cards** — for classes with a beast companion or familiar

Class identity is expressed in each card's visual style — spells shared between classes are duplicated per deck by design.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — vision, folder layout, data shapes, decisions log
- [CONTRIBUTING.md](CONTRIBUTING.md) — prerequisites, scripts, workflow

## Tech

React 19 · Vite · TypeScript · CSS Modules · pnpm · biome · node:test

## Data

Spell and class data sourced from the [D&D 5e 2024 SRD](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data).

> The System Reference Document 5.2 is released under the [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/) license by Wizards of the Coast LLC.
> This project uses SRD content under those terms. All D&D trademarks and non-SRD content remain property of Wizards of the Coast LLC.

## License

MIT — see [LICENSE](LICENSE).
