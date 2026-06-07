import cantripsData from "../../data/spells/spells-level-0.json" with { type: "json" };
import spellsLevel1Data from "../../data/spells/spells-level-1.json" with { type: "json" };
import wizardSpellsData from "../../data/spells/wizard-spells.json" with { type: "json" };

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

function resolveSpellIds(ids: string[], table: Record<string, Spell>): Spell[] {
  return ids.map((id) => {
    const s = table[id];
    if (!s) throw new Error(`wizard-spells.json references unknown spell id: "${id}"`);
    return s;
  });
}

const CLASS_DATA: Partial<Record<CharacterClass, { cantrips: Spell[]; level1: Spell[] }>> = {
  wizard: {
    cantrips: resolveSpellIds(wizardSpellsData.cantrips, ALL_CANTRIPS),
    level1: resolveSpellIds(wizardSpellsData.level1, ALL_LEVEL_1),
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

  findAll({ cls, level }: { cls: CharacterClass; level: SpellLevel }): Spell[] {
    const data = CLASS_DATA[cls];
    if (!data) return [];
    if (level === 0) return data.cantrips;
    if (level === 1) return data.level1;
    return []; // levels 2-9 not vendored yet
  },
};
