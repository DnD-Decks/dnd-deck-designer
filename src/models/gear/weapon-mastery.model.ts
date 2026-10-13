import weaponMasteryData from "../../data/gear/weapon-mastery.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type WeaponMasteryName =
  | "cleave"
  | "graze"
  | "nick"
  | "push"
  | "sap"
  | "slow"
  | "topple"
  | "vex";

export type WeaponMasteryDetails = {
  id: WeaponMasteryName;
  description: string;
};

// Raw JSON is a Record<WeaponMasteryName, descriptionString>; inject id from key.
const RAW = weaponMasteryData as Record<WeaponMasteryName, string>;

const DATA: WeaponMasteryDetails[] = (Object.keys(RAW) as WeaponMasteryName[]).map((id) => ({
  id,
  description: RAW[id],
}));

const TABLE = lookup({ items: DATA, key: "id", label: "weapon mastery" });

export const weaponMastery = {
  get: ({ id }: { id: WeaponMasteryName }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
