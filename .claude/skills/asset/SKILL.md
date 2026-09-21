---
name: asset
description: Render the image-generation prompt for a deck card's background art (spell, class feature, class resource or weapon-mastery property — ChatGPT-oriented) and create or update its `[asset]:` GitHub issue. Also runs in batch over every level-1 card. Use when asked for card art prompts or asset issues, e.g. `/asset fire bolt`, `/asset rogue sneak attack`, `/asset all`.
argument-hint: <card name | card id | class + name | all [spells|feats|resources|masteries]> [--dry-run]
---

# /asset — art prompt + asset issue for a deck card

Given a card, render its image-generation prompt from the template in this folder and upsert the matching `[asset]:` GitHub issue so an art contributor can pick it up. With `all`, do it for every card a level-1 character can hold.

Flags:

- `--dry-run` — steps 1–3 only: resolve, render, print. Never touches GitHub.

## Card kinds and asset identity

Every card the deck renders (`src/decks/deck.model.ts` → `DeckCard`) gets exactly one asset. The asset id is the file name under `public/art/<asset-id>.png`.

| Kind | Data | Asset id | Orientation | Shared across classes? |
| --- | --- | --- | --- | --- |
| spell | `src/data/spells/spells-level-*.json` (objects keyed by spell id) | `<spell-id>` — `fire-bolt` | portrait 5:7 | yes: one painting per spell, Wizard and Sorcerer both use `fire-bolt.png`. Never create per-class variants. |
| feat (class feature) | `src/data/feats/<class>-feats.json` (arrays) | the JSON `id`, already class-prefixed — `rogue-sneak-attack` | **landscape 7:5** | no: `wizard-spellcasting` and `cleric-spellcasting` are different paintings (their text and imagery differ). |
| resource | `src/data/resources/<class>-resources.json` (arrays) | the JSON `id`, already class-prefixed — `barbarian-rage` | portrait 5:7 | no, same reason. |
| weapon mastery | `src/data/gear/weapon-mastery.json` (object keyed by property id) | `mastery-<id>` — `mastery-cleave` | portrait 5:7 | yes: the same property card sits in every martial deck. The `mastery-` prefix keeps it clear of spell ids (`slow` is both a mastery and a spell). |

Orientation is decided by the card kind, never by how "active" the text sounds: feat cards are the passive, text-heavy ones and the deck renders them horizontal (`feat-card.module.css` swaps the poker dimensions). Everything else is a portrait card.

Level-1 scope of a batch run: spells listed under `cantrips` or `level1` in any `src/data/spells/<class>-spells.json`, every feat, every resource, every mastery property.

## Steps

### 1. Resolve the card

Accept a name, an id, or `<class> <name>`. Trim a trailing `--dry-run` first.

1. Kebab-case the argument (lowercase, spaces → `-`). Look that key up, in order, in: spell files, feat arrays (`id`), resource arrays (`id`), mastery object keys (also accept a `mastery-` prefix).
2. No id hit: case-insensitive match on `name` across all four kinds.
   - Exactly one hit → use it.
   - Several hits (`spellcasting` × 7 feats, `mana` × 9 resources, `weapon mastery` × 4 feats): if the argument starts with a class name (`rogue sneak attack`, `wizard spellcasting`), keep the hit from that class. Otherwise list the candidate ids and stop.
3. Still nothing: grep all four data sets for partial matches, list the near-miss ids as suggestions, and stop. Do not create an issue.

Report the resolved `kind`, `asset id` and, for feats and resources, the `class` (the file prefix).

### 2. Render the prompt

Fill `asset.template.prompt.md` (same folder as this file). Two parts are data-driven: the `SCENE` block (first in the prompt) and the orientation (`{{orientation}}` in the opening line plus the `OUTPUT` block). Everything from `## VISUAL STYLE` down to `## OUTPUT` is the shared house style — reproduce it **verbatim**, never reworded per card.

- `{{name}}` — verbatim from the JSON (`name`; for masteries the capitalised key: `cleave` → `Cleave`).
- `{{subtitle}}` — per kind:
  - spell: `<School> cantrip` when `level` is `0`, otherwise `<School> level N spell`.
  - feat: `<Class> level 1 class feature` (the `source` field says it: `Rogue Level 1`).
  - resource: `<Class> class resource`.
  - weapon mastery: `weapon mastery property`.
- `{{scene}}` — **2–3 sentences that a painter could act on**, in this order: SUBJECT (who or what), ACTION (the spell or feature happening, visibly), SETTING (one simple environment), LIGHT (where the light comes from and its colour). Concrete nouns only. No dice, numbers, rule words (Advantage, Bonus Action, saving throw, resistance, feet).
  - Spells usually already describe imagery: take the first 1–2 sentences of `description` and only add the missing SETTING/LIGHT beats.
  - Feats, resources and masteries are rules text: translate the mechanic into what it *looks like*. `Sneak Attack` → a rogue mid-lunge from a dark alcove into the exposed back of a distracted foe, blade catching the only light. `Rage` → a barbarian mid-roar, veins of red-hot light, weapon raised, dust and embers around. `Cleave` → one great axe swing carrying through two foes in a single arc.
  - Abstract resources like `Mana` get a symbolic scene (a well of arcane light, a hand cupping a flame of the class's colour), still concrete.
- `{{orientation}}` / `{{output}}` — by kind. Feat: `horizontal` and the landscape OUTPUT block from the template header (7:5, ≥ 1050 × 750 px, compose across the width). Every other kind: `vertical` and the portrait block (5:7, ≥ 750 × 1050 px). For a landscape feat, also write the `{{scene}}` so it reads left to right — subject on one side, what it acts on across the frame.
- `{{extra_note}}` — optional whole line. Spell with a `damage` field: `The visual centers on <damage.type joined with "/"> damage.` Weapon mastery: `Weapons that carry this property: <names of weapons in src/data/gear/weapons.json whose mastery is this id>.` Every other case: remove the line (no blank placeholder).

Strip the HTML comment header from the output.

### 3. Show the prompt

Print the rendered prompt in a fenced code block, ready to paste into ChatGPT. Stop here on `--dry-run`.

### 4. Upsert the GitHub issue (idempotent)

Title, per kind — the class makes feat and resource titles unique:

| Kind | Title |
| --- | --- |
| spell | ``[asset]: `Fire Bolt` spell`` |
| feat | ``[asset]: `Sneak Attack` rogue feat`` |
| resource | ``[asset]: `Rage` barbarian resource`` |
| weapon mastery | ``[asset]: `Cleave` weapon mastery`` |

Skip entirely (report "already delivered") when `public/art/<asset-id>.png` exists.

Check for an existing issue, open or closed:

```sh
gh issue list --state all --label ASSET --search "[asset]: <name>" --json number,title,state
```

Match on the exact title.

- **Closed match:** the asset was delivered or dropped — report it, do not reopen.
- **No match:**

  ```sh
  gh issue create --title "<title>" --label ASSET --body "<body>"
  ```

- **Open match:** update instead of duplicating:

  ```sh
  gh issue edit <number> --body "<body>"
  ```

Issue body format:

```markdown
<!-- generated by /asset — do not edit by hand; re-run `/asset <asset-id>` to regenerate -->

## Asset ID

`<asset-id>`

## Card data snapshot

| Field | Value |
| --- | --- |
| Kind | <spell | feat | resource | weapon mastery> |
| Name | <name> |
| <School / Class / Weapons> | <value> |
| <Level, spells only> | <level> |
| Orientation | <portrait 5:7 | landscape 7:5> |

## Image-generation prompt (paste into ChatGPT)

​```
<rendered prompt>
​```

## Acceptance criteria

- [ ] PR adds `public/art/<asset-id>.png` — <5:7 portrait, ≥ 750 × 1050 px | 7:5 landscape, ≥ 1050 × 750 px>
- [ ] PR body references `Closes #<this issue number>`
```

### 5. Report

Print the issue URL and whether it was created, updated, skipped (closed) or already delivered.

## Batch mode — `/asset all [spells|feats|resources|masteries]`

1. Build the level-1 inventory (see *Card kinds*), deduplicated by asset id; restrict to one kind when given.
2. Print the inventory as a table (`asset id · kind · name · status`) with the count **before** touching GitHub. Status is one of `delivered` (PNG exists), `open #N`, `closed #N`, `missing`. Fetch issue state once with `gh issue list --state all --label ASSET --limit 500 --json number,title,state` and match titles locally — do not query per card.
3. Run steps 2–5 for every `missing` card, and step 4's *update* path for every `open` one so it carries the current template. Never touch `delivered` or `closed` ones.
4. Finish with totals: created / updated / skipped / delivered.

Use `--dry-run` to get the inventory table and nothing else.
