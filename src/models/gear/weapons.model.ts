import weaponsData from "../../data/gear/weapons.json" with { type: "json" };

import type { DamageType } from "src/models/damage/damage-types.model";
import type { WeaponMasteryName } from "src/models/gear/weapon-mastery.model";
import type { WeaponPropertyId } from "src/models/gear/weapon-properties.model";

export type WeaponProficiency = "simple" | "martial";
export type WeaponRange = "melee" | "ranged";

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
const BY_ID = new Map<string, Weapon>(DATA.map((w) => [w.id, w]));

// BG3 has no icon for these five; cards fall back to the weapon's name.
const WITHOUT_ICON = new Set<WeaponId>(["lance", "whip", "blowgun", "musket", "pistol"]);

/** `/icons/weapon-<id>.png` (see scripts/sync-bg3-icons), or undefined when BG3 has none. */
export const weaponIcon = (id: WeaponId) =>
  WITHOUT_ICON.has(id) ? undefined : `/icons/weapon-${id}.png`;

export const weapons = {
  get({ id }: { id: WeaponId }): Weapon {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`Unknown weapon: ${id}`);
    return found;
  },

  find({ id }: { id: string }): Weapon | undefined {
    return BY_ID.get(id);
  },

  list(): readonly Weapon[] {
    return DATA;
  },
};
