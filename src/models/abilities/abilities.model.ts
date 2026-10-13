import abilitiesData from "../../data/abilities/abilities.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type AbilityName = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type AbilityScores = Record<AbilityName, number>;

export type AbilityDetails = {
  id: AbilityName;
  label: string;
  short: string;
};

export function computeModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

const TABLE = lookup({ items: abilitiesData as AbilityDetails[], key: "id", label: "ability" });

export const abilities = {
  get: ({ id }: { id: AbilityName }) => TABLE.get(id),
  list: TABLE.list,
};
