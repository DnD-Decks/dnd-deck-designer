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
import { lookup } from "../../lib/lookup.ts";

import type { CharacterClass } from "src/models/class/classes.model";
import type { DamageType } from "src/models/damage/damage-types.model";

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
  damage?: { dice: string; type: DamageType[] };
  icon?: string;
};

type SpellTable = Record<string, Spell>;

const ALL_CANTRIPS = cantripsData as SpellTable;
const ALL_LEVEL_1 = spellsLevel1Data as SpellTable;
const ALL_LEVEL_2 = spellsLevel2Data as SpellTable;

const ALL: Spell[] = [ALL_CANTRIPS, ALL_LEVEL_1, ALL_LEVEL_2].flatMap(Object.values);
const TABLE = lookup({ items: ALL, key: "id", label: "spell" });

type ClassSpellList = {
  cantrips: string[];
  level1: string[];
  level2?: string[];
};

type ResolveIds = { ids: string[]; table: SpellTable; source: string };

function resolveSpellIds({ ids, table, source }: ResolveIds) {
  return ids.map((id) => {
    const s = table[id];
    if (!s) throw new Error(`${source} references unknown spell id: "${id}"`);
    return s;
  });
}

function resolveClassSpells({ data, source }: { data: ClassSpellList; source: string }) {
  const { cantrips, level1, level2 } = data;
  return {
    cantrips: resolveSpellIds({ ids: cantrips, table: ALL_CANTRIPS, source }),
    level1: resolveSpellIds({ ids: level1, table: ALL_LEVEL_1, source }),
    level2: level2 && resolveSpellIds({ ids: level2, table: ALL_LEVEL_2, source }),
  };
}

const CLASS_DATA: Partial<Record<CharacterClass, ReturnType<typeof resolveClassSpells>>> = {
  bard: resolveClassSpells({ data: bardSpellsData, source: "bard-spells.json" }),
  cleric: resolveClassSpells({ data: clericSpellsData, source: "cleric-spells.json" }),
  druid: resolveClassSpells({ data: druidSpellsData, source: "druid-spells.json" }),
  paladin: resolveClassSpells({ data: paladinSpellsData, source: "paladin-spells.json" }),
  ranger: resolveClassSpells({ data: rangerSpellsData, source: "ranger-spells.json" }),
  sorcerer: resolveClassSpells({ data: sorcererSpellsData, source: "sorcerer-spells.json" }),
  warlock: resolveClassSpells({ data: warlockSpellsData, source: "warlock-spells.json" }),
  wizard: resolveClassSpells({ data: wizardSpellsData, source: "wizard-spells.json" }),
};

export const spells = {
  get: ({ id }: { id: string }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,

  findAll({ cls, level }: { cls: CharacterClass; level: SpellLevel }) {
    const data = CLASS_DATA[cls];
    if (!data) return [];
    if (level === 0) return data.cantrips;
    if (level === 1) return data.level1;
    if (level === 2) return data.level2 ?? [];
    return [];
  },
};
