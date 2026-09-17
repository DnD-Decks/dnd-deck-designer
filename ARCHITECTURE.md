# Architecture

## Deck scope

12 PHB classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Card categories per deck:**

| Category | Kind | Layout | Status | Example |
|---|---|---|---|---|
| Resource | `resource` | vertical | ✓ 10 classes with L1 resources (monk, rogue: none) | "Mana ×2", "Second Wind ×1" |
| Class feature / feat | `feat` | horizontal (landscape) | ✓ all 12 classes (L1) | "Arcane Recovery", "Fighting Style" |
| Spell | `spell` | vertical | ✓ all 8 caster classes (L1 only) | "Fireball" (Wizard) |
| Weapon mastery | `weapon-mastery` | vertical (spell layout) | ✓ 5 mastery classes (all 8 properties) | "Cleave", "Graze" |
| Companion stats | `companion` | — | deferred | Ranger's beast companion |

Spells shared between classes are intentionally duplicated — visual class identity is in card style, not shared components. Decks show cantrips + level-1 only (`SPELL_LEVELS = [0, 1]` in `deck.model.ts`). Section order: Resources → Class Features → Spells → Weapon Masteries.

---

## Adding a new card kind

1. Author JSON in `src/data/<domain>/`.
2. Create model `src/models/<domain>/<domain>.model.ts` exporting a single object with `findAll({cls})`.
3. Add a new union arm to `DeckCard` in `src/decks/deck.model.ts`.
4. Assemble cards in `decks.get()` in the desired section order.
5. Add arms to the three `switch(card.kind)` functions in `src/decks/deck-view.component.tsx` (`sectionLabel`, `cardKey`, `renderCard`). The `assertNever` default guards make missing arms compile errors.
6. Create `src/cards/<kind>-card.component.tsx` + CSS module.

---

## Card rendering model

Cards are React components with **fixed physical proportions** — the goal is WYSIWYG printing.

- Reference size: **63.5 × 88.9 mm** (standard poker card).
    - Screen view: grid of cards at a comfortable reading scale.
    - Print view: `@media print` overrides — mm units, bleed/cut margins, page breaks between decks.
- **Horizontal feat cards** swap dimensions: `width: var(--card-height); height: var(--card-width)`.
- **Weapon-mastery cards** reuse `spell-card.module.css` directly (same-folder relative import), overriding `--school-color` via inline style.
- Use semantic HTML (`<article>`, `<h3>`) so cards are role-queryable in RTL tests.

---

## Art assets

Card art is **AI-generated outside the repo** — there is no generation step in the build, no image pipeline, no dependency. The repo stores finished PNGs only.

| | |
|---|---|
| Path | `public/art/<spell-id>.png` — served at `/art/<spell-id>.png` |
| Format | 5:7 portrait (MTG card ratio), ≥ 750 × 1050 px |
| Id | the kebab-case spell id from `src/data/spells/*.json` — `fire-bolt`, `true-strike`, `cure-wounds` |

**Identity is per spell, shared across classes.** A spell that appears in several decks is still one painting: `fire-bolt.png` serves both Wizard and Sorcerer. Class identity lives in card *style* (§ *Deck scope*), never in the art — so there are no per-class variants to keep in sync.

**Full-card background, not a boxed vignette.** The house style (`DECK BACKGROUND STYLE v1`, in `.claude/skills/asset/asset.template.prompt.md`) forbids borders, frames, UI, text and reserved empty areas: the asset is a standalone painting that the card's chrome sits on top of. 5:7 maps 1:1 onto the card face (`--card-width` × `--card-height` = 63.5 × 88.9 mm), so the image needs no cropping.

**Missing art degrades silently** — no broken-image icon, no layout shift. Today every card renders the school-letter placeholder in the `.art` box (`spell-card.component.tsx`); painting the background layer and falling back to the `--school-color` wash is #18. No assets ship yet — `public/art/` does not exist until the first one lands.

**Where the issues come from.** `/asset <spell>` resolves the spell in `src/data/spells/`, renders the prompt template with its fields (only the `SCENE` block is data-driven; the house style above it is verbatim) and creates — or edits, it is idempotent — an issue titled ``[asset]: `<name>` spell`` labelled `ASSET`, carrying the prompt and the acceptance checklist. Contributor-side steps: `CONTRIBUTING.md` § *Delivering a card asset*.

---

## Data source

JSON for spells is vendored from sibling repo [`dnd-beginner-character-sheet-5e-2024/src/data`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data). Class features, resources, and weapon masteries are authored by hand in this repo.

### Present data

| Path | Contents |
|---|---|
| `spells/spells-level-0.json` | 33 cantrips, keyed by id |
| `spells/spells-level-1.json` | 55 level-1 spells, keyed by id |
| `spells/spells-level-2.json` | 35 level-2 spells, keyed by id (vendored; not in L1 decks) |
| `spells/{class}-spells.json` | Spell id lists for 8 caster classes |
| `classes/<cls>.json` | 12 class files: label, icon, hitDie, saves, proficiencies |
| `classes/class-resources.json` | Level-progression resource data for all 12 classes (consumed by `class-resources.model.ts`) |
| `resources/<cls>-resources.json` | L1 resources for 10 classes (monk, rogue: none) |
| `feats/<cls>-feats.json` | L1 class features for all 12 classes |
| `gear/weapon-mastery.json` | All 8 PHB 2024 mastery properties, SRD-audited (class-agnostic; also feeds the card-facing `weapon-masteries` model) |

### Deferred

| Path | Contents |
|---|---|
| `common/` | Abilities, actions, gear |
| `origin/` | Backgrounds, origin feats, species |

### Spell record shape

See `Spell` type in `src/models/spells/spells.model.ts`.

---

## Testing

Component tests run under **vitest** with a jsdom DOM environment. `test/setup.ts` (loaded via `setupFiles`) calls `afterEach(cleanup)` globally so individual test files need no boilerplate. Vitest reuses `vite.config.ts` — the same React plugin, path aliases, and CSS-module handling that powers the build apply to tests automatically.

Pure model tests (`*.model.test.ts`) have no DOM dependency and can use either vitest or `node:test`.

---

## Models tier

`src/models/` is the typed bridge between raw JSON (`src/data/`) and components. **Components never touch JSON directly** — they call typed methods on model objects.

Each model module exports a single object (named after the entity) with a subset of a small, stable API (not every module needs all four methods):

| Method | Returns |
|---|---|
| `get({id})` | `T` — throws on unknown id |
| `find({id})` | `T \| undefined` |
| `findAll({...})` | `T[]` |
| `list()` | `T[]` |

Current modules:

| Module | Exports |
|---|---|
| `src/models/spells/spells.model.ts` | `spells` — cantrips + lvl-1+2 spells; `findAll({cls, level})` |
| `src/models/class/classes.model.ts` | `classes` — all 12 PHB class details |
| `src/models/resources/resources.model.ts` | `resources` — class resources; `findAll({cls})` |
| `src/models/feats/feats.model.ts` | `feats` — class features; `findAll({cls})` |
| `src/models/weapon-masteries/weapon-masteries.model.ts` | `weaponMasteries` — mastery properties; `findAll({cls})`, `list()` |

Conventions follow [`dnd-beginner-character-sheet-5e-2024/src/models/CLAUDE.md`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/blob/main/src/models/CLAUDE.md).
