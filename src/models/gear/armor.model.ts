import armorData from "../../data/gear/armor.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type ArmorCategory = "light" | "medium" | "heavy" | "shield";

export type ArmorId =
  | "padded-armor"
  | "leather-armor"
  | "studded-leather-armor"
  | "hide-armor"
  | "chain-shirt"
  | "scale-mail"
  | "breastplate"
  | "half-plate-armor"
  | "ring-mail"
  | "chain-mail"
  | "splint-armor"
  | "plate-armor"
  | "shield";

type ArmorDexBonusCap =
  | { dexModifier: false; maxDexModifier: null }
  | { dexModifier: true; maxDexModifier: number | null };

export type Armor = {
  id: ArmorId;
  name: string;
  category: ArmorCategory;
  baseAc: number;
  requiredStr: number | null;
  stealthDisadvantage: boolean;
} & ArmorDexBonusCap;

const DATA = armorData as Armor[];

const TABLE = lookup({ items: DATA, key: "id", label: "armor" });

export const armor = {
  get: ({ id }: { id: ArmorId }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
