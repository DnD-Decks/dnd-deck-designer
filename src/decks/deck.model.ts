// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { choices } from "../characters/choices.model.ts";
import { assertNever } from "../lib/assert-never.ts";
import { classes } from "../models/class/classes.model.ts";
import { feats } from "../models/feats/feats.model.ts";
import { weapons } from "../models/gear/weapons.model.ts";
import { resources } from "../models/resources/resources.model.ts";
import { spells } from "../models/spells/spells.model.ts";

import type { Character } from "src/characters/character.model";
import type { CharacterClass, ClassDetails } from "src/models/class/classes.model";
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

const copies = (card: DeckCard) =>
  card.kind === "resource" && card.resource.stack ? card.resource.uses : 1;

const SPELL_LEVELS: SpellLevel[] = [0, 1];

// Decks are pure over static JSON, so each class is assembled at most once.
const CACHE = new Map<CharacterClass, Deck>();

export const decks = {
  get({ cls }: { cls: CharacterClass }): Deck {
    const cached = CACHE.get(cls);
    if (cached) return cached;

    const resourceCards: DeckCard[] = resources
      .findAll({ cls })
      .map((resource): DeckCard => ({ kind: "resource", resource }));

    const featCards: DeckCard[] = feats
      .findAll({ cls })
      .map((feat): DeckCard => ({ kind: "feat", feat }));

    const spellCards: DeckCard[] = SPELL_LEVELS.flatMap((level) =>
      spells.findAll({ cls, level }).map((spell): DeckCard => ({ kind: "spell", spell }))
    );

    const weaponCards: DeckCard[] = weapons
      .findAll({ cls })
      .map((weapon): DeckCard => ({ kind: "weapon", weapon }));

    const deck: Deck = {
      cls: classes.get({ id: cls }),
      cards: [...resourceCards, ...featCards, ...spellCards, ...weaponCards],
    };
    CACHE.set(cls, deck);
    return deck;
  },

  /** the class template narrowed to a character's picks, stacked resources expanded per use */
  forCharacter(character: Character): CharacterDeck {
    const { cls, cards } = decks.get({ cls: character.cls });
    const picked = choices.picked(character);

    const entries = cards
      .filter((card) => {
        if (card.kind === "spell") return picked.spell.has(card.spell.id);
        if (card.kind === "weapon") return picked.weapon.has(card.weapon.id);
        return true;
      })
      .flatMap((card) =>
        Array.from({ length: copies(card) }, (_, n) => ({
          key: `${cardKey(card)}-${n}`,
          card,
        }))
      );

    return { cls, entries };
  },
};
