import skillsData from "../../data/skills/skills.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

import type { AbilityName } from "src/models/abilities/abilities.model";

export type SkillName =
  | "athletics"
  | "acrobatics"
  | "sleight-of-hand"
  | "stealth"
  | "arcana"
  | "history"
  | "investigation"
  | "nature"
  | "religion"
  | "animal-handling"
  | "insight"
  | "medicine"
  | "perception"
  | "survival"
  | "deception"
  | "intimidation"
  | "performance"
  | "persuasion";

export type SkillDefinition = {
  name: SkillName;
  label: string;
  ability: AbilityName;
};

const DATA = skillsData as SkillDefinition[];

const TABLE = lookup({ items: DATA, key: "name", label: "skill" });

export const skills = {
  get: ({ name }: { name: SkillName }) => TABLE.get(name),
  find: ({ name }: { name: string }) => TABLE.find(name),
  list: TABLE.list,

  findAll({ ability }: { ability: AbilityName }) {
    return DATA.filter((s) => s.ability === ability);
  },
};

export const DEFAULT_PROFICIENCIES: SkillName[] = ["insight", "perception"];
