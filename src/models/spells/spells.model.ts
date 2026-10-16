import bardSpellsData from "../../data/spells/bard-spells.json" with { type: "json" };
import clericSpellsData from "../../data/spells/cleric-spells.json" with { type: "json" };
import druidSpellsData from "../../data/spells/druid-spells.json" with { type: "json" };
import paladinSpellsData from "../../data/spells/paladin-spells.json" with { type: "json" };
import rangerSpellsData from "../../data/spells/ranger-spells.json" with { type: "json" };
import sorcererSpellsData from "../../data/spells/sorcerer-spells.json" with { type: "json" };
import cantripsData from "../../data/spells/spells-level-0.json" with { type: "json" };
import spellsLevel1Data from "../../data/spells/spells-level-1.json" with { type: "json" };
import spellsLevel2Data from "../../data/spells/spells-level-2.json" with { type: "json" };
import spellsLevel3Data from "../../data/spells/spells-level-3.json" with { type: "json" };
import spellsLevel4Data from "../../data/spells/spells-level-4.json" with { type: "json" };
import spellsLevel5Data from "../../data/spells/spells-level-5.json" with { type: "json" };
import spellsLevel6Data from "../../data/spells/spells-level-6.json" with { type: "json" };
import spellsLevel7Data from "../../data/spells/spells-level-7.json" with { type: "json" };
import spellsLevel8Data from "../../data/spells/spells-level-8.json" with { type: "json" };
import spellsLevel9Data from "../../data/spells/spells-level-9.json" with { type: "json" };
import warlockSpellsData from "../../data/spells/warlock-spells.json" with { type: "json" };
import wizardSpellsData from "../../data/spells/wizard-spells.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

import type { CharacterClass } from "src/models/class/classes.model";
import type { DamageType } from "src/models/damage/damage-types.model";
import type { Provenance } from "src/models/provenance/provenance.model";

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Spell = {
  provenance?: Provenance;
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
  atHigherLevels?: string;
  save?: string;
  damage?: { dice: string; type: DamageType[] };
  icon?: string;
};

type SpellTable = Record<string, Spell>;

const LEVEL_TABLES: Record<SpellLevel, SpellTable> = {
  0: cantripsData as SpellTable,
  1: spellsLevel1Data as SpellTable,
  2: spellsLevel2Data as SpellTable,
  3: spellsLevel3Data as SpellTable,
  4: spellsLevel4Data as SpellTable,
  5: spellsLevel5Data as SpellTable,
  6: spellsLevel6Data as SpellTable,
  7: spellsLevel7Data as SpellTable,
  8: spellsLevel8Data as SpellTable,
  9: spellsLevel9Data as SpellTable,
};

const ALL: Spell[] = Object.values(LEVEL_TABLES).flatMap(Object.values);
const TABLE = lookup({ items: ALL, key: "id", label: "spell" });

type ClassSpellList = { cantrips: string[] } & Partial<
  Record<`level${Exclude<SpellLevel, 0>}`, string[]>
>;

type ResolveIds = { ids: string[]; table: SpellTable; source: string };

function resolveSpellIds({ ids, table, source }: ResolveIds) {
  return ids.map((id) => {
    const s = table[id];
    if (!s) throw new Error(`${source} references unknown spell id: "${id}"`);
    return s;
  });
}

function resolveClassSpells({ data, source }: { data: ClassSpellList; source: string }) {
  const levels = Object.keys(LEVEL_TABLES).map(Number) as SpellLevel[];
  return Object.fromEntries(
    levels.map((level) => [
      level,
      resolveSpellIds({
        ids: data[level === 0 ? "cantrips" : (`level${level}` as const)] ?? [],
        table: LEVEL_TABLES[level],
        source,
      }),
    ])
  ) as Record<SpellLevel, Spell[]>;
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
    return data[level];
  },
};
