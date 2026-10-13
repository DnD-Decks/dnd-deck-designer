import weaponsData from "../../data/gear/weapons.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";
import { classes } from "../class/classes.model.ts";

import type { CharacterClass, ProficiencyGrant } from "src/models/class/classes.model";

import type { DamageType } from "src/models/damage/damage-types.model";
import type { WeaponMasteryName } from "src/models/gear/weapon-mastery.model";

export type WeaponProficiency = "simple" | "martial";
export type WeaponRange = "melee" | "ranged";

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

export type WeaponPropertyRef = WeaponPropertyId | { id: WeaponPropertyId; detail: string };

export type WeaponId =
  | "club"
  | "dagger"
  | "greatclub"
  | "handaxe"
  | "javelin"
  | "light-hammer"
  | "mace"
  | "quarterstaff"
  | "sickle"
  | "spear"
  | "dart"
  | "light-crossbow"
  | "shortbow"
  | "sling"
  | "battleaxe"
  | "flail"
  | "glaive"
  | "greataxe"
  | "greatsword"
  | "halberd"
  | "lance"
  | "longsword"
  | "maul"
  | "morningstar"
  | "pike"
  | "rapier"
  | "scimitar"
  | "shortsword"
  | "trident"
  | "warhammer"
  | "war-pick"
  | "whip"
  | "blowgun"
  | "hand-crossbow"
  | "heavy-crossbow"
  | "longbow"
  | "musket"
  | "pistol";

export type Weapon = {
  id: WeaponId;
  name: string;
  proficiency: WeaponProficiency;
  range: WeaponRange;
  damage: { dice: string; type: DamageType };
  properties: WeaponPropertyRef[];
  mastery: WeaponMasteryName;
};

const DATA = weaponsData as Weapon[];
const TABLE = lookup({ items: DATA, key: "id", label: "weapon" });

// BG3 has no icon for these five; cards fall back to the weapon's name.
const WITHOUT_ICON = new Set<WeaponId>(["lance", "whip", "blowgun", "musket", "pistol"]);

const propertyId = (ref: WeaponPropertyRef) => (typeof ref === "string" ? ref : ref.id);

// monk and rogue get martial weapons only when they carry one of the listed properties
function grants({ grant, weapon }: { grant: ProficiencyGrant; weapon: Weapon }) {
  if (typeof grant === "boolean") return grant;
  return weapon.properties.some((ref) => grant.property.includes(propertyId(ref)));
}

/** `/icons/weapon-<id>.png` (see scripts/sync-bg3-icons), or undefined when BG3 has none. */
export const weaponIcon = (id: WeaponId) =>
  WITHOUT_ICON.has(id) ? undefined : `/icons/weapon-${id}.png`;

export const weapons = {
  get: ({ id }: { id: WeaponId }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,

  findAll({ cls }: { cls: CharacterClass }): readonly Weapon[] {
    const { proficiencies } = classes.get({ id: cls });
    return DATA.filter((weapon) => {
      const grant = proficiencies[`${weapon.proficiency}-weapons`];
      return grants({ grant, weapon });
    });
  },
};
