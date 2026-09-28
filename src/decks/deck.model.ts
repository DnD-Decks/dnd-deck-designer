// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { classes } from "../models/class/classes.model.ts";
import { feats } from "../models/feats/feats.model.ts";
import { weapons } from "../models/gear/weapons.model.ts";
import { resources } from "../models/resources/resources.model.ts";
import { spells } from "../models/spells/spells.model.ts";

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
};
