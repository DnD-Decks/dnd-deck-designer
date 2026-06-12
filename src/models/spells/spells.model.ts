import bardSpellsData from "../../data/spells/bard-spells.json" with { type: "json" };
import clericSpellsData from "../../data/spells/cleric-spells.json" with { type: "json" };
import druidSpellsData from "../../data/spells/druid-spells.json" with { type: "json" };
import paladinSpellsData from "../../data/spells/paladin-spells.json" with { type: "json" };
import rangerSpellsData from "../../data/spells/ranger-spells.json" with { type: "json" };
import sorcererSpellsData from "../../data/spells/sorcerer-spells.json" with { type: "json" };
import cantripsData from "../../data/spells/spells-level-0.json" with { type: "json" };
import spellsLevel1Data from "../../data/spells/spells-level-1.json" with { type: "json" };
import spellsLevel2Data from "../../data/spells/spells-level-2.json" with { type: "json" };
import warlockSpellsData from "../../data/spells/warlock-spells.json" with { type: "json" };
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
const ALL_LEVEL_2 = spellsLevel2Data as Record<string, Spell>;

const ALL: Spell[] = [ALL_CANTRIPS, ALL_LEVEL_1, ALL_LEVEL_2].flatMap(Object.values);
const BY_ID = new Map(ALL.map((s) => [s.id, s]));

type ClassSpellList = {
  cantrips: string[];
  level1: string[];
  level2?: string[];
};

function resolveSpellIds(ids: string[], table: Record<string, Spell>, source: string): Spell[] {
  return ids.map((id) => {
    const s = table[id];
    if (!s) throw new Error(`${source} references unknown spell id: "${id}"`);
    return s;
  });
}

function resolveClassSpells(data: ClassSpellList, source: string) {
  return {
    cantrips: resolveSpellIds(data.cantrips, ALL_CANTRIPS, source),
    level1: resolveSpellIds(data.level1, ALL_LEVEL_1, source),
    level2: data.level2 ? resolveSpellIds(data.level2, ALL_LEVEL_2, source) : undefined,
  };
}

const CLASS_DATA: Partial<
  Record<CharacterClass, { cantrips: Spell[]; level1: Spell[]; level2?: Spell[] }>
> = {
  bard: resolveClassSpells(bardSpellsData as ClassSpellList, "bard-spells.json"),
  cleric: resolveClassSpells(clericSpellsData as ClassSpellList, "cleric-spells.json"),
  druid: resolveClassSpells(druidSpellsData as ClassSpellList, "druid-spells.json"),
  paladin: resolveClassSpells(paladinSpellsData as ClassSpellList, "paladin-spells.json"),
  ranger: resolveClassSpells(rangerSpellsData as ClassSpellList, "ranger-spells.json"),
  sorcerer: resolveClassSpells(sorcererSpellsData as ClassSpellList, "sorcerer-spells.json"),
  warlock: resolveClassSpells(warlockSpellsData as ClassSpellList, "warlock-spells.json"),
  wizard: resolveClassSpells(wizardSpellsData as ClassSpellList, "wizard-spells.json"),
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
    if (level === 2) return data.level2 ?? [];
    return [];
  },
};
