# Architecture

## Deck scope

12 PHB classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Card categories per deck:**

| Category | Kind | Layout | Status | Example |
|---|---|---|---|---|
| Resource | `resource` | vertical | ✓ 10 classes with L1 resources (monk, rogue: none) | "Mana ×2", "Second Wind ×1" |
| Class feature / feat | `feat` | horizontal (landscape) | ✓ all 12 classes (L1) | "Arcane Recovery", "Fighting Style" |
| Spell | `spell` | vertical | ✓ all 8 caster classes (L1 only) | "Fire Bolt" (Wizard) |
| Weapon mastery | `weapon-mastery` | vertical (spell layout) | ✓ 5 mastery classes (all 8 properties) | "Cleave", "Graze" |
| Companion stats | `companion` | — | deferred | Ranger's beast companion |

Spells shared between classes are intentionally duplicated — visual class identity is in card style, not shared components. Decks show cantrips + level-1 only (`SPELL_LEVELS = [0, 1]` in `deck.model.ts`). Section order: Resources → Class Features → Spells → Weapon Masteries.

---

## Adding a new card kind

1. Author JSON in `src/data/<domain>/`.
2. Create model `src/models/<domain>/<domain>.model.ts` exporting a single object with `findAll({cls})`.
3. Add a new union arm to `DeckCard` in `src/decks/deck.model.ts`.
4. Assemble cards in `decks.get()` in the desired section order.
5. Add arms to the four `switch(card.kind)` functions in `src/decks/deck-view.component.tsx` (`sectionLabel`, `cardKey`, `cardName`, `renderCard`). The `assertNever` default guards make missing arms compile errors.
6. Create `src/cards/<kind>-card.component.tsx` + CSS module.

---

## Card rendering model

Cards are React components with **fixed physical proportions** — the goal is WYSIWYG printing.

- Reference size: **63.5 × 88.9 mm** (standard poker card).
    - Screen view: grid of cards at a comfortable reading scale.
    - Print view: `@media print` overrides — mm units, bleed/cut margins, page breaks between decks.
- **Horizontal feat cards** swap dimensions: `width: var(--card-height); height: var(--card-width)`.
- **Weapon-mastery cards** reuse `spell-card.module.css` directly (same-folder relative import), overriding `--school-color` via inline style.
- **Background art** is a layer behind frosted panels — see § *Art assets*. Cards are `position: relative` for it; panels print with `print-color-adjust: exact`.
- **Click to inspect**: every card in a row sits in a slot with a transparent `Zoom <name>` button over its face. Clicking one holds it in `CardSpotlight` — a `<dialog open>` that blurs the mat behind it and scales the *same* card component up (up to 2.6×, viewport permitting), so what you inspect is what prints. The deck behind is `inert` + `aria-hidden` while a card is held; Escape, the mat and *Put it back* all return it, and focus goes back to the card in the row. **← / →** (and the two named neighbours in the caption) walk the whole deck in reading order, crossing section boundaries and refitting the lift when the card shape changes; `deck-view` keeps a `cardKey → button` ref map so the card you arrive at is the one focus returns to. Because a card can be on the mat and in the spotlight at once, heading ids come from `useId()`, never from the card id.
- Use semantic HTML (`<article>`, `<h3>`) so cards are role-queryable in RTL and Playwright tests. Deck sections carry an `aria-label` (their section name) and keep the card tally *outside* the `<h2>`, so a heading reads "Level 1", not "Level 123 cards".

---

## Art assets

Card art is **AI-generated outside the repo** — no generation step, no image pipeline, no dependency. The repo stores finished PNGs only, one per card, at `public/art/<asset-id>.png` (served at `/art/<asset-id>.png`).

| Kind | Asset id | Orientation | Shared across classes |
|---|---|---|---|
| spell | spell id — `fire-bolt` | portrait 5:7, ≥ 750 × 1050 px | yes — one painting per spell |
| feat | class-prefixed JSON id — `rogue-sneak-attack` | landscape 7:5, ≥ 1050 × 750 px | no |
| resource | class-prefixed JSON id — `barbarian-rage` | portrait 5:7, ≥ 750 × 1050 px | no |
| weapon mastery | `mastery-<id>` — `mastery-cleave` | portrait 5:7, ≥ 750 × 1050 px | yes — the same property card sits in every martial deck |

Class identity lives in card *style* (§ *Deck scope*), never in shared art, so there are no per-class spell variants. The `mastery-` prefix keeps mastery ids clear of spell ids (`slow` is both).

**Full-card background, not a boxed vignette.** The house style (`DECK BACKGROUND STYLE v2`, in `.claude/skills/asset/asset.template.prompt.md`) forbids borders, frames, UI, text and reserved empty areas: the asset is a standalone painting that the card's chrome sits on top of. Each ratio matches its card face 1:1, so the image needs no cropping.

**How a card paints it.** Every card renders `CardArt` (`src/cards/card-art.component.tsx`) as its first child: an absolutely positioned, presentational `<img>` covering the whole card (`object-fit: cover`). The chrome sits on top as **frosted panels** — tinted, translucent (`color-mix(... transparent)`), `backdrop-filter: blur` — never opaque, so the painting stays visible through the text. A transparent *art window* (fixed 26 mm on portrait cards; whatever the text panel leaves on the landscape feat card) shows it unblurred.

**Missing art degrades silently.** A file that 404s fires the image's `onError` and `CardArt` unmounts itself: no broken-image glyph, no layout shift, and the card's colour wash (`color-mix(<kind-color> 12%, parchment)`) shows in the window. `card-art.component.test.tsx` and `spell-card.component.test.tsx` cover it.

**Where the issues come from.** `/asset <card>` renders the prompt (only the `SCENE` block and the orientation are data-driven; the style is verbatim) and creates — or updates, it is idempotent — an issue titled ``[asset]: `<name>` <kind>`` labelled `ASSET`. `/asset all` does it for every level-1 card. Contributor steps: `CONTRIBUTING.md` § *Delivering a card asset*.

## Iconography

Card glyphs are Baldur's Gate 3 game icons from bg3.wiki, vendored into the flat `public/icons/`
folder by `pnpm scripts:sync-bg3-icons` (explicit pick-list, sha1-verified, writes
`public/icons/manifest.json`; provenance and licence caveat in `public/icons/SOURCE.md`). Icons are
plain `/icons/<kind>-<id>.<ext>` URL strings rendered through `src/lib/icon.component.tsx` — never
imported as modules. The map from domain value to file lives with the domain it serves:

| Card | Glyphs | Map |
|---|---|---|
| Spell | casting time, mana, ritual/concentration, range, duration, save, dice, damage type | `src/models/spells/spell-icon.model.ts` (+ `ACTION_TIMING_ICONS` in `actions/combat.model.ts`) |
| Resource | resource icon (`Resource.icon` in `src/data/resources/*.json`), action timing | data + `actions/combat.model.ts` |
| Class feature | class badge, decorative | `feats.model.ts` projects `ClassDetails.icon` (`src/data/classes/<cls>.json`) |
| Weapon mastery | one weapon icon per weapon carrying the property (name always, icon when BG3 has one) | `weaponIcon()` in `gear/weapons.model.ts`; `WeaponMastery.weapons` |
| Class selector | class badge, decorative | `ClassDetails.icon` |

A badge shown next to visible text is rendered `decorative` (empty `alt`) so it does not change the
element's accessible name; standalone glyphs keep `alt` = their label, which is what tests query.

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

End-to-end tests run the real app in Chromium via **Playwright**, from `e2e/` (excluded from the vitest glob). The app has no backend — data is bundled JSON and icons are served from the dev server — so instead of mocking endpoints the suite installs a network guard that aborts every cross-origin request, making "the deck renders with zero outbound traffic" an assertion rather than an assumption. Card layout is covered by locator-scoped screenshots whose baselines are generated in the pinned Playwright Docker image. See [e2e/README.md](e2e/README.md).

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
