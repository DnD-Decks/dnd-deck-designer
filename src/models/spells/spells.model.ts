import cantripsData from "src/data/spells/spells-level-0.json";
import spellsLevel1Data from "src/data/spells/spells-level-1.json";
import wizardSpellsData from "src/data/spells/wizard-spells.json";

import type { CharacterClass } from "src/models/class/classes.model";

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Spell = {
  id: string;
  name: string;
  level: SpellLevel;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  save?: string;
  damage?: { dice: string; type: string[] };
  icon?: string;
};

const ALL_CANTRIPS = cantripsData as Record<string, Spell>;
const ALL_LEVEL_1 = spellsLevel1Data as Record<string, Spell>;

const ALL: Spell[] = [...Object.values(ALL_CANTRIPS), ...Object.values(ALL_LEVEL_1)];
const BY_ID = new Map(ALL.map((s) => [s.id, s]));

const CLASS_DATA: Partial<Record<CharacterClass, { cantrips: Spell[]; level1: Spell[] }>> = {
  wizard: {
    cantrips: wizardSpellsData.cantrips.map((id) => ALL_CANTRIPS[id]),
    level1: wizardSpellsData.level1.map((id) => ALL_LEVEL_1[id]),
  },
};

export const spells = {
  get({ id }: { id: string }): Spell {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`Unknown spell: ${id}`);
    return found;
  },

  find({ id }: { id: string }): Spell | undefined {
    return BY_ID.get(id);
  },

  list(): Spell[] {
    return ALL;
  },

  findAll({ cls, level }: { cls: CharacterClass; level: 0 | 1 }): Spell[] {
    const data = CLASS_DATA[cls];
    if (!data) return [];
    return level === 0 ? data.cantrips : data.level1;
  },
};
