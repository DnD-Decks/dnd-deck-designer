// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { choices } from "../characters/choices.model.ts";
import { assertNever } from "../lib/assert-never.ts";
import { classes } from "../models/class/classes.model.ts";
import { progression } from "../models/class/progression.model.ts";
import { feats } from "../models/feats/feats.model.ts";
import { weapons } from "../models/gear/weapons.model.ts";
import { resources } from "../models/resources/resources.model.ts";
import { spells } from "../models/spells/spells.model.ts";

import type { Character } from "src/characters/character.model";
import type { CharacterClass, ClassDetails } from "src/models/class/classes.model";
import type { CharacterLevel, LandType } from "src/models/class/progression.model";
import type { Feat } from "src/models/feats/feats.model";
import type { Weapon } from "src/models/gear/weapons.model";
import type { Resource } from "src/models/resources/resources.model";
import type { Spell, SpellLevel } from "src/models/spells/spells.model";

export type DeckCard =
  | { kind: "spell"; spell: Spell }
  | { kind: "resource"; resource: Resource }
  | { kind: "feat"; feat: Feat }
  | { kind: "weapon"; weapon: Weapon };

export type Deck = { cls: ClassDetails; cards: readonly DeckCard[] };

/** `key` is `kind-id-n`: stable across renders, unique per copy of a stacked card */
export type DeckEntry = { key: string; card: DeckCard };

export type CharacterDeck = { cls: ClassDetails; entries: readonly DeckEntry[] };

export function cardKey(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return `resource-${card.resource.id}`;
    case "feat":
      return `feat-${card.feat.id}`;
    case "spell":
      return `spell-${card.spell.id}`;
    case "weapon":
      return `weapon-${card.weapon.id}`;
    default:
      return assertNever(card);
  }
}

export function cardName(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return card.resource.name;
    case "feat":
      return card.feat.name;
    case "spell":
      return card.spell.name;
    case "weapon":
      return card.weapon.name;
    default:
      return assertNever(card);
  }
}

/** the section a card belongs to in the catalog ("Class Features", "Level 1", …) */
export function cardSection(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return "Resources";
    case "feat":
      return "Class Features";
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : `Level ${card.spell.level}`;
    case "weapon":
      return "Weapons";
    default:
      return assertNever(card);
  }
}

export const catalogEntry = (card: DeckCard) => ({
  key: cardKey(card),
  card,
  section: cardSection(card),
});

const copies = (card: DeckCard) =>
  card.kind === "resource" && card.resource.stack ? card.resource.uses : 1;

// Static class templates are assembled once per level and land choice.
const CACHE = new Map<string, Deck>();

// Same for the key index across every class's deck: built once, on first lookup.
let CARD_INDEX: Map<string, DeckCard> | undefined;

const cardIndex = () => {
  if (!CARD_INDEX) {
    CARD_INDEX = new Map();
    for (const level of progression.levels) {
      for (const { id } of classes.list()) {
        for (const card of decks.get({ cls: id, level }).cards) {
          const key = cardKey(card);
          if (!CARD_INDEX.has(key)) CARD_INDEX.set(key, card);
        }
      }
    }
  }
  return CARD_INDEX;
};

export const decks = {
  get({
    cls,
    level = 1,
    land,
  }: { cls: CharacterClass; level?: CharacterLevel; land?: LandType }): Deck {
    const cacheKey = `${cls}-${level}-${land ?? "temperate"}`;
    const cached = CACHE.get(cacheKey);
    if (cached) return cached;

    const resourceCards: DeckCard[] = resources
      .findAll({ cls, level })
      .map((resource): DeckCard => ({ kind: "resource", resource }));

    const featCards: DeckCard[] = feats
      .findAll({ cls, level })
      .map((feat): DeckCard => ({ kind: "feat", feat }));

    const spellLevels: SpellLevel[] =
      progression.spellLevel({ cls, level }) === 2 ? [0, 1, 2] : [0, 1];
    const available = spellLevels.flatMap((spellLevel) =>
      spells.findAll({ cls, level: spellLevel })
    );
    for (const id of progression.alwaysPrepared({ cls, level, land })) {
      if (!available.some((spell) => spell.id === id)) available.push(spells.get({ id }));
    }
    const spellCards = available
      .sort((a, b) => a.level - b.level)
      .map((spell): DeckCard => ({ kind: "spell", spell }));

    const weaponCards: DeckCard[] = weapons
      .findAll({ cls })
      .map((weapon): DeckCard => ({ kind: "weapon", weapon }));

    const deck: Deck = {
      cls: classes.get({ id: cls }),
      cards: [...resourceCards, ...featCards, ...spellCards, ...weaponCards],
    };
    CACHE.set(cacheKey, deck);
    return deck;
  },

  /** a card by its `cardKey`, across every class's deck */
  findCard({ key }: { key: string }) {
    return cardIndex().get(key);
  },

  /** the class template narrowed to a character's picks, stacked resources expanded per use */
  forCharacter(character: Character): CharacterDeck {
    const { cls, cards } = decks.get(character);
    const picked = choices.picked(character);

    const kept = cards.filter((card) => {
      switch (card.kind) {
        case "spell":
          return picked.spell.has(card.spell.id);
        case "weapon":
          return picked.weapon.has(card.weapon.id);
        case "resource":
        case "feat":
          return true;
        default:
          return assertNever(card);
      }
    });

    // Custom picks carry card keys; unknown keys and cards already in the
    // character's deck are skipped (an unpicked same-class card is appended).
    const seen = new Set(kept.map(cardKey));
    for (const key of character.picks.custom ?? []) {
      const card = decks.findCard({ key });
      if (card && !seen.has(key)) {
        seen.add(key);
        kept.push(card);
      }
    }

    const entries = kept.flatMap((card) =>
      Array.from({ length: copies(card) }, (_, n) => ({
        key: `${cardKey(card)}-${n}`,
        card,
      }))
    );

    return { cls, entries };
  },
};
