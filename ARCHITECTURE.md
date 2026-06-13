# Architecture

## Deck scope

12 PHB classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Card categories per deck:**

| Category | One card per… | Example |
|---|---|---|
| Spell slot | Available slot level | "Level 1 Slot ×4" |
| Class feature / feat | Named class ability | "Arcane Recovery" |
| Spell | Spell in the class's spell list | "Fireball" (Wizard) |
| Companion stats | Companion / familiar stat block | Ranger's beast companion |

> Spells shared between classes are **intentionally duplicated** per deck: visual class identity is expressed in card style, not shared components.

---

## Card rendering model

Cards are React components with **fixed physical proportions** — the goal is WYSIWYG printing.

- Reference size: **63.5 × 88.9 mm** (standard poker card).
    - Screen view: grid of cards at a comfortable reading scale.
    - Print view: `@media print` overrides — mm units, bleed/cut margins, page breaks between decks.

Each class deck is composed in `src/decks/<class>/index.tsx`.

---

## Data source

JSON vendored from sibling repo [`dnd-beginner-character-sheet-5e-2024/src/data`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data) into `src/data/` (same relative paths).

### Vendored files (✓ present locally)

| File | Contents |
|---|---|
| `spells/spells-level-0.json` | 33 cantrips, keyed by id |
| `spells/spells-level-1.json` | 54 level-1 spells, keyed by id |
| `spells/wizard-spells.json` | Wizard spell id lists (cantrips, level1, level2) |
| `classes/<cls>.json` | One file per class (12 total): label, icon, hitDie, saves, proficiencies |

### Deferred files (not yet vendored)

| File | Contents |
|---|---|
| `spells/spells-level-2.json` | Level-2 spells |
| `spells/{class}-spells.json` | Spell id lists for the other 11 classes |
| `common/` | Abilities, actions, gear |
| `origin/` | Backgrounds, origin feats, species |

> **Data import mechanism: deferred.** When ready, add a `scripts/fetch-data.mjs` (zero deps, Node built-in fetch) that downloads the JSON files from the sibling repo's `main` branch into `src/data/`.

> **Level progression (spell slots, resource tracks):** vendoring and modelling is deferred. Re-vendor `class/class-resources.json` from the sibling repo and add `src/models/class/class-resources.model.ts` when the deck needs it.

### Spell record shape

```ts
type Spell = {
  id: string;           // kebab-case
  name: string;
  level: number;        // 0 = cantrip
  school: string;       // "Abjuration" | "Evocation" | …
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  save?: string;
  damage?: { dice: string; type: string[] };
  icon?: string;        // sprite ref e.g. "vol3/icon-vol3_20"
};
```

### Class detail record shape (excerpt)

```ts
type ClassDetails = {
  id: CharacterClass;
  label: string;
  icon: string;
  hitDie: string;       // "d6" | "d8" | "d10" | "d12"
  saves: string;
  description: string;
  manualClassification: "martial" | "spell-caster" | "versatile";
  proficiencies: { /* armor, weapon, skill options */ };
};
```

---

## Testing

Component tests run under **vitest** with a jsdom DOM environment. `test/setup.ts` (loaded via `setupFiles`) calls `afterEach(cleanup)` globally so individual test files need no boilerplate. Vitest reuses `vite.config.ts` — the same React plugin, path aliases, and CSS-module handling that powers the build apply to tests automatically.

Pure model tests (`*.model.test.ts`) have no DOM dependency and can use either vitest or `node:test`.

---

## Models tier

`src/models/` is the typed bridge between raw JSON (`src/data/`) and components. **Components never touch JSON directly** — they call typed methods on model objects.

Each model module exports a single object (named after the entity) with a small, stable API:

| Method | Returns |
|---|---|
| `get({id})` | `T` — throws on unknown id |
| `find({id})` | `T \| undefined` |
| `findAll({...})` | `T[]` |
| `list()` | `T[]` |

Current modules:

| Module | Exports |
|---|---|
| `src/models/spells/spells.model.ts` | `spells` — cantrips + lvl-1 spells; `findAll({cls, level})` |
| `src/models/class/classes.model.ts` | `classes` — all 12 PHB class details |

Conventions follow [`dnd-beginner-character-sheet-5e-2024/src/models/CLAUDE.md`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/blob/main/src/models/CLAUDE.md).
