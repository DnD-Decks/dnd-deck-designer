import weaponPropertiesData from "../../data/gear/weapon-properties.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type WeaponPropertyId =
  | "ammunition"
  | "finesse"
  | "heavy"
  | "light"
  | "loading"
  | "range"
  | "reach"
  | "thrown"
  | "two-handed"
  | "versatile";

export type WeaponProperty = {
  id: WeaponPropertyId;
  description: string;
};

// Raw JSON is a Record<WeaponPropertyId, descriptionString>; inject id from key.
const RAW = weaponPropertiesData as Record<WeaponPropertyId, string>;

const DATA: WeaponProperty[] = Object.entries(RAW).map(([id, description]) => ({
  id: id as WeaponPropertyId,
  description,
}));

const TABLE = lookup({ items: DATA, key: "id", label: "weapon property" });

export const weaponProperties = {
  get: ({ id }: { id: WeaponPropertyId }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
