# Architecture

## Vision

A static web tool for laying out ("maquetar") D&D 5.5 (2024 PHB) card decks — one deck per class, one card per game element. The primary output is a print-ready browser page; secondary is screen preview.

**The 12 PHB classes** each get a dedicated deck: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Card categories per deck:**

| Category | One card per… | Example |
|---|---|---|
| Spell slot | Available slot level | "Level 1 Slot ×4" |
| Class feature / feat | Named class ability | "Arcane Recovery" |
| Spell | Spell in the class's spell list | "Fireball" (Wizard) |
| Companion stats | Companion / familiar stat block | Ranger's beast companion |

> Spells shared between classes are **intentionally duplicated** per deck — visual class identity is expressed in card style, not shared components.

---

## Card rendering model

Cards are React components with **fixed physical proportions** — the goal is WYSIWYG printing.

- Reference size: **63.5 × 88.9 mm** (standard poker card). _(Open decision — confirm before wiring print CSS.)_
- Screen view: grid of cards at a comfortable reading scale.
- Print view: `@media print` overrides — mm units, bleed/cut margins, page breaks between decks.

Each card category maps to a component in `src/cards/`:

```
src/cards/
  SpellSlotCard/
  FeatCard/
  SpellCard/
  CompanionCard/
```

Each class deck is composed in `src/decks/<class>/index.tsx`.

---

## Planned folder layout

> Not yet created. This is the target structure.

```
src/
  cards/          # card components (one sub-folder per category)
  decks/          # deck composition per class (12 folders)
  data/           # static JSON (spells, class details, feats)
  styles/         # global CSS: print layout, page setup, design tokens
  lib/            # low-level primitives (no domain)
  services/       # I/O (data loaders)
```

---

## Data source

JSON imported from sibling repo [`dnd-beginner-character-sheet-5e-2024/src/data`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data).

### Known files

| File | Contents |
|---|---|
| `spells/spells-level-{0-2}.json` | Full spell records by level |
| `spells/{class}-spells.json` | Spell ID lists per class (bard, cleric, druid, paladin, ranger, sorcerer, warlock, wizard) |
| `class/class-details.json` | Class metadata: label, icon, hitDie, saves, proficiencies, starting equipment |
| `class/class-resources.json` | Level progression tables (spell slots, class resource tracks) |
| `common/abilities.json` | Ability score rules |
| `common/actions.json` | Action types |
| `common/gear/` | Weapons, armor, mastery, properties |
| `origin/` | Backgrounds, origin feats, species |

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
  icon: string;         // sprite ref e.g. "vol3/icon-vol3_20"
};
```

### Class detail record shape (excerpt)

```ts
type ClassDetail = {
  label: string;
  icon: string;
  hitDie: string;       // "d8" | "d10" | …
  saves: string;
  description: string;
  manualClassification: "martial" | "spell-caster" | "half-caster";
  proficiencies: { /* armor, weapon, skill options */ };
  startingEquipment: Array<Array<{ item: string; quantity: number }>>;
};
```

> **Data import mechanism: deferred.** When ready, add a `scripts/fetch-data.mjs` (zero deps, Node built-in fetch) that downloads the JSON files from the sibling repo's `main` branch into `src/data/`.

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-06 | Docs-only scaffold first | Establish agentic-programming conventions before any code |
| 2026-06-06 | Data import deferred | Unblock docs; import script is trivial once skeleton lands |
| 2026-06-06 | `node:test` over vitest | Minimize deps; Node ≥ 22 built-in runner is sufficient |
| 2026-06-06 | Vite over Astro | Pet project; no SSR/SSG needed; Vite is simpler |
| 2026-06-06 | CSS Modules over Tailwind/CSS-in-JS | Match sibling repo idiom; explicit, printable, zero runtime |
| open | Card physical size (poker 63.5×88.9 mm?) | Confirm before wiring `@media print` CSS |
