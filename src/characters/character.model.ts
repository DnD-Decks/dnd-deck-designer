import type { ChoiceRuleId } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";

export type CharacterLevel = 1;

/** picked ids per choice rule */
export type Picks = Readonly<Partial<Record<ChoiceRuleId, readonly string[]>>>;

export type Character = {
  id: string;
  name: string;
  cls: CharacterClass;
  level: CharacterLevel;
  picks: Picks;
};

export const characters = {
  create({ name, cls }: { name: string; cls: CharacterClass }): Character {
    return { id: crypto.randomUUID(), name, cls, level: 1, picks: {} };
  },
};
