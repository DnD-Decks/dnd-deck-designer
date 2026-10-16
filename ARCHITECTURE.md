# Architecture

## Product vision

A mobile-first web tool for D&D 2024 players. The main use case is playing at the table: open your character on your phone, tap cards to spend resources, rest to recover them. Build characters on desktop, share them via link, and add custom cards from the catalog for complex builds.

**Character creation scope:** The builder handles class-granted picks only (cantrips, prepared spells, weapon mastery). Full character creation (background, species, origin feats) is deferred — users can add cards manually from the catalog. This keeps the app focused on the play experience.

## Deck scope

12 PHB classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard.

**Card categories per deck:**

| Category | Kind | Layout | Status | Example |
|---|---|---|---|---|
| Resource | `resource` | vertical | ✓ 11 classes through L3 (rogue: none) | "Mana ×2", "Second Wind ×2" |
| Class feature / feat | `feat` | horizontal (landscape) | ✓ all 12 classes (L1–3) | "Arcane Recovery", "Fighting Style" |
| Spell | `spell` | vertical | ✓ all 8 caster classes (through character level 3) | "Fire Bolt" (Wizard) |
| Weapon | `weapon` | vertical (spell layout) | ✓ all 12 classes — every weapon the class is proficient with; the card carries its mastery property | "Longsword", "Shortbow" |
| Companion stats | `companion` | — | deferred | Ranger's beast companion |

Spells shared between classes are intentionally duplicated — visual class identity is in card style, not shared components. The catalog defaults to character level 1. Character decks use their selected level (1–3); level-3 full casters and Warlocks also gain level-2 spells. Play section order: Resources → Weapons → Features → Cantrips → Spells.

**Template vs character.** `decks.get({ cls, level = 1, land, subclass })` is the class template (the catalog), cached by class, level, land, and subclass choice. `decks.forCharacter(character)` narrows it to the character's picks (`src/characters/choices.model.ts`, rules in `src/data/choices/class-choices.json`) and expands resources marked `stack: true` into one card per use (Mana ×2 → 2 cards); pools such as Lay on Hands stay one card.

## Character levels

The builder supports levels 1, 2, and 3 for all twelve classes. `src/models/class/progression.model.ts` projects `src/data/classes/class-progression.json`: prepared-spell counts, slot counts, resource pools, always-prepared spells, and subclass options. The SRD subclass is included automatically at level 3. Fighters choose Champion (the backward-compatible default when `subclass` is omitted) or Battle Master (PHB 2024). Battle Masters choose three of twenty maneuvers and receive four individually spendable d8 Superiority Dice, all recovered on a Short or Long Rest. Their optional `subclass` and maneuver picks are saved and shared. Champion features are excluded when Battle Master is selected. Student of War describes the extra skill and Artisan's Tools proficiencies; the builder does not model those choices. Circle of the Land Druids choose arid, polar, temperate, or tropical land; this optional `land` field is saved and shared, and defaults to temperate.

- Choices keep the same rule ids across levels. At level 3, full casters and Warlocks can mix level-1 and level-2 prepared spells; Paladins and Rangers still use level-1 spells. Always-prepared spells are included separately and do not consume choices.
- Changing level preserves available choices, removes unavailable spells, and trims choices to the new limits. Editing an older build moves spells now granted automatically out of its manual choices and asks for any replacements needed. Existing level-1 saves and share links remain readable.
- Feat data uses optional `level` (default 1) and `descriptions` overrides by character level. Resource data uses optional `level`, with counts projected from class progression. Full casters get separate level-2 Mana cards; Warlock Mana becomes level 2 at character level 3 and still recharges on a Short Rest.
- Internal feature options such as Fighting Styles, Metamagic, and Eldritch Invocations remain described on reference cards. The builder selects spells, weapons, and Battle Master maneuvers; it does not provide a full character sheet.

### Content provenance

Spell, feature, weapon, and resource data accept optional `provenance: { source, page?, referenceUrl? }`. `src/data/provenance/sources.json` identifies the original publication, publisher, open-content status, license, and consulted reference separately. No declaration means SRD 5.2.1 / CC-BY-4.0, following the project's default assumption. An unknown explicit source throws rather than silently treating the card as open.

All Battle Master features, maneuvers, Superiority Dice, and its subclass option declare `source: "phb-2024"` and a PHB page. This source is non-SRD (`openContent: false`, `license: null`), with 5e.tools recorded as the consulted reference. Card text consists of original mechanical summaries. Reference availability does not imply a license grant; see NOTICE.

`cardProvenance(card)` resolves the metadata for every card kind, including stacked copies and custom additions. A future open-content filter can use `entries.filter(({ card }) => cardProvenance(card).openContent)` without parsing display labels. The SRD audit reports explicitly non-SRD entries as outside its scope.

---

## Routes

Hash routing with [wouter](https://github.com/molefrog/wouter) (`wouter/use-hash-location`), table in `src/app/app.routes.tsx`. Hash URLs need no host rewrite rules and keep the app a static bundle.

| Path | Page |
|---|---|
| `#/` | Your characters (`src/characters/characters.page.tsx`): the ones saved on this device |
| `#/new` | Character builder (`src/characters/character-builder.page.tsx`) |
| `#/character/<id>` | A saved character's deck, with Share (`src/characters/character.page.tsx`) |
| `#/character/<id>/edit` | Edit an existing character in the builder |
| `#/character/<id>/add/<cls>` | Add cards to a character from the catalog in selection mode (`src/decks/add-cards.page.tsx`); `#/character/<id>/add` and unknown classes go to the character's class |
| `#/import/<code>` | Preview of a shared build with "Save to this device" (`src/characters/character-import.page.tsx`) |
| `#/catalog/<cls>` | Card catalog: every card a class can have (`src/decks/catalog.page.tsx`); `#/catalog` and unknown classes go to the wizard |
| `#<cls>` | pre-routing link, redirected to `#/catalog/<cls>` |

**Storage and sharing.** Characters and their play state (`spent` card keys) live in localStorage via `src/services/character.storage.ts`; every access is wrapped so the app still runs when storage is blocked, and stored entries are re-validated with `characters.parse`. A share code is the build `{ cls, level, name, picks, land? }` as base64url JSON (`characters.toShareCode` / `fromShareCode`); the id stays out, so an import is a new copy.

**Play state.** Each copy of a resource is its own card. Tap a card to zoom it, then Spend / Recover beside "Put it back". Spent cards turn a quarter-turn and dim. A long rest recovers everything; a short rest recovers `short-rest` resources, or `shortRest` uses when a resource sets it (Second Wind, Rage: one). The `spent` array stores deck-entry keys; `src/characters/play.model.ts` decides what each rest brings back.

---

## Character model

**Character shape.** A character is `{ id, name, cls, level, picks }` where `picks` is a map from choice rule ID to selected card IDs. The builder handles class-granted choices only (defined in `src/data/choices/class-choices.json`). Cards added by hand from the catalog live under a `custom` picks key — card keys (`spell-cure-wounds`), not card IDs — with no capacity limit. `custom` is not a choice rule, so `choices.validate` never sees it.

**Choice rules.** Each rule has `{ id, label, pick, from: { kind, ... } }` where `pick` is the number to choose and `from` specifies the source (spells by level, weapons by proficiency). The validation helper `choices.validate()` reports missing or invalid picks.

**Levels.** Currently level 1 only. The data structure supports level-keyed rules for future expansion (cumulative decks per level).

---

## Catalog and custom cards

**Catalog purpose.** The catalog (`#/catalog/<cls>`) shows every card a class can have — the full template deck. It serves as a reference and as a way to add custom cards to characters.

**Adding cards to characters.** From a character's play view, *Add cards* opens the catalog carousel in selection mode at `#/character/<id>/add/<cls>` (`src/decks/add-cards.page.tsx`). Tapping the centred card toggles it; confirming writes the card keys to `picks.custom`. `decks.findCard({ key })` resolves a card key against a lazily built index of every class deck — `decks.forCharacter` appends the resolved cards to the character's deck (unknown keys skipped, no duplicates). This allows players to add background feats, species traits, or any other cards the simple builder doesn't cover.

**Validation.** The catalog add flow does not validate whether a character can use a card (e.g., a wizard adding cleric spells). The player decides; the app trusts them.

---

## Adding a new card kind

1. Author JSON in `src/data/<domain>/`.
2. Create model `src/models/<domain>/<domain>.model.ts` exporting a single object with `findAll({cls})`.
3. Add a new union arm to `DeckCard` in `src/decks/deck.model.ts`.
4. Assemble cards in `decks.get()` in the desired section order.
5. Add arms to the `switch(card.kind)` functions: `cardKey`, `cardName` and `cardSection` in `src/decks/deck.model.ts`, and the face switch in `src/cards/deck-card.component.tsx`. The `assertNever` default guards make missing arms compile errors.
6. Create `src/cards/<kind>-card.component.tsx` + CSS module.

---

## Card rendering model

Cards are React components with **fixed physical proportions** — the goal is WYSIWYG printing.

- Reference size: **63.5 × 88.9 mm** (standard poker card).
    - Screen view: grid of cards at a comfortable reading scale.
    - Print view: `@media print` overrides — mm units, bleed/cut margins, page breaks between decks.
- **Horizontal feat cards** swap dimensions: `width: var(--card-height); height: var(--card-width)`.
- **Weapon cards** reuse `spell-card.module.css` for the shell (same-folder relative import), overriding `--school-color` via inline style; `weapon-card.module.css` adds the properties line and the *Weapon Mastery* block.
- **Background art** is a layer behind frosted panels — see § *Art assets*. Cards are `position: relative` for it; panels print with `print-color-adjust: exact`.
- **Click to inspect**: every card in a row sits in a slot with a transparent `Zoom <name>` button over its face. Clicking one holds it in `CardSpotlight` — a `<dialog open>` that blurs the mat behind it and scales the *same* card component up (up to 2.6×, viewport permitting), so what you inspect is what prints. The deck behind is `inert` + `aria-hidden` while a card is held; Escape, the mat and *Put it back* all return it, and focus goes back to the card in the row. **← / →** (and the two named neighbours in the caption) walk the whole deck in reading order, crossing section boundaries and refitting the lift when the card shape changes; `deck-view` keeps a `cardKey → button` ref map so the card you arrive at is the one focus returns to. Because a card can be on the mat and in the spotlight at once, heading ids come from `useId()`, never from the card id.
- Use semantic HTML (`<article>`, `<h3>`) so cards are role-queryable in RTL and Playwright tests. Deck sections carry an `aria-label` (their section name) and keep the card tally *outside* the `<h2>`, so a heading reads "Level 1", not "Level 123 cards".

---

## Art assets

Card art is generated by the asset pipeline or supplied by a contributor. The repo accepts a compressed draft JPEG at `public/art/<asset-id>.jpg` and existing PNG artwork at `public/art/<asset-id>.png`. `CardArt` loads PNG first and tries JPEG if none exists.

| Kind | Asset id | Orientation | Shared across classes |
|---|---|---|---|
| spell | spell id — `fire-bolt` | portrait 5:7, 720 × 1008 px draft JPEG | yes — one painting per spell |
| feat | class-prefixed JSON id — `rogue-sneak-attack` | landscape 7:5, 1008 × 720 px draft JPEG | no |
| resource | class-prefixed JSON id — `barbarian-rage` | portrait 5:7, 720 × 1008 px draft JPEG | no |
| weapon | `weapon-<id>` — `weapon-longsword` | portrait 5:7, 720 × 1008 px draft JPEG | yes — one painting per weapon |

Class identity lives in card *style* (§ *Deck scope*), never in shared art, so there are no per-class spell variants. The `weapon-` prefix keeps weapon ids clear of spell ids.

**Full-card background, not a boxed vignette.** The house style (`DECK BACKGROUND STYLE v2`, in `.claude/skills/asset/asset.template.prompt.md`) forbids borders, frames, UI, text and reserved empty areas: the asset is a standalone painting that the card's chrome sits on top of. Each ratio matches its card face 1:1, so the image needs no cropping.

**How a card paints it.** Every card renders `CardArt` (`src/cards/card-art.component.tsx`) as its first child: an absolutely positioned, presentational `<img>` covering the whole card (`object-fit: cover`). The chrome sits on top as **frosted panels** — tinted, translucent (`color-mix(... transparent)`), `backdrop-filter: blur` — never opaque, so the painting stays visible through the text. A transparent *art window* (fixed 26 mm on portrait cards; whatever the text panel leaves on the landscape feat card) shows it unblurred.

**Missing art degrades silently.** If both PNG and JPEG files 404, `CardArt` unmounts the image: no broken-image glyph or layout shift, and the card's colour wash (`color-mix(<kind-color> 12%, parchment)`) shows in the window. `card-art.component.test.tsx` and `spell-card.component.test.tsx` cover it.

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
| Weapon | weapon icon (decorative, when BG3 has one), dice, damage type, range | `weaponIcon()` in `gear/weapons.model.ts` + `spell-icon.model.ts` |
| Class selector | class badge, decorative | `ClassDetails.icon` |

A badge shown next to visible text is rendered `decorative` (empty `alt`) so it does not change the
element's accessible name; standalone glyphs keep `alt` = their label, which is what tests query.

---

## Data source

JSON for spells is vendored from sibling repo [`dnd-beginner-character-sheet-5e-2024/src/data`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/tree/main/src/data). Class features and resources are authored by hand in this repo.

### Present data

| Path | Contents |
|---|---|
| `spells/spells-level-0.json` | 33 cantrips, keyed by id |
| `spells/spells-level-1.json` | 56 level-1 spells, keyed by id |
| `spells/spells-level-2.json` | 57 level-2 spells, keyed by id (used by level-3 caster characters) |
| `spells/{class}-spells.json` | Spell id lists for 8 caster classes |
| `classes/<cls>.json` | 12 class files: label, icon, hitDie, saves, proficiencies |
| `classes/class-resources.json` | Level-progression resource data for all 12 classes (consumed by `class-resources.model.ts`) |
| `resources/<cls>-resources.json` | Resources through L3 for 11 classes (rogue: none); unlock level and recharge rules |
| `feats/<cls>-feats.json` | Class and SRD subclass features through L3 for all 12 classes |
| `feats/fighter-battle-master-feats.json` | PHB 2024 Battle Master features and 20 selectable maneuvers, with explicit provenance |
| `provenance/sources.json` | Publication, consulted references, and open-content status; missing card provenance defaults to SRD |
| `classes/class-progression.json` | Character levels 1–3: prepared spells, slots, resource counts, subclass names, granted spells |
| `gear/weapons.json` | 38 SRD weapons: damage, properties, mastery (feeds the weapon cards) |
| `gear/weapon-mastery.json` | All 8 PHB 2024 mastery properties, SRD-audited (printed on each weapon card) |

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

Pure model tests (`*.model.test.ts`) have no DOM dependency; they run under vitest too, some asserting with `node:assert/strict`.

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
| `src/models/gear/weapons.model.ts` | `weapons` — SRD weapons; `findAll({cls})` filters by class proficiency |

Conventions follow [`dnd-beginner-character-sheet-5e-2024/src/models/CLAUDE.md`](https://github.com/manuartero/dnd-beginner-character-sheet-5e-2024/blob/main/src/models/CLAUDE.md).
