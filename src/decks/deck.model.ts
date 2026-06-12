// Runtime imports are relative with .ts extension so node:test can resolve them
// (the src/* alias only exists for tsc and vite).
import { classes } from "../models/class/classes.model.ts";
import { spells } from "../models/spells/spells.model.ts";

import type { CharacterClass, ClassDetails } from "src/models/class/classes.model";
import type { Spell, SpellLevel } from "src/models/spells/spells.model";

export type DeckCard = { kind: "spell"; spell: Spell };
// future kinds are additive: | { kind: "slot"; ... } | { kind: "feat"; ... } | { kind: "companion"; ... }

export type Deck = { cls: ClassDetails; cards: DeckCard[] };

const SPELL_LEVELS: SpellLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const decks = {
  get({ cls }: { cls: CharacterClass }): Deck {
    const cards = SPELL_LEVELS.flatMap((level) =>
      spells.findAll({ cls, level }).map((spell): DeckCard => ({ kind: "spell", spell }))
    );
    return { cls: classes.get({ id: cls }), cards };
  },
};
