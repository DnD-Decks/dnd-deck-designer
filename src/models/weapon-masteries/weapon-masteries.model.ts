import weaponMasteryData from "../../data/gear/weapon-mastery.json" with { type: "json" };

import type { CharacterClass } from "src/models/class/classes.model";
import type { WeaponMasteryName } from "src/models/gear/weapon-mastery.model";

export type WeaponMastery = {
  id: WeaponMasteryName;
  name: string;
  description: string;
  icon?: string;
};

// Single source of truth is the SRD-audited gear/weapon-mastery.json
// (Record<WeaponMasteryName, description>); the card projection derives
// the display name from the id.
const RAW = weaponMasteryData as Record<WeaponMasteryName, string>;

const ALL: WeaponMastery[] = (Object.keys(RAW) as WeaponMasteryName[]).map((id) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  description: RAW[id],
}));

// D&D 2024: classes with the level-1 Weapon Mastery feature get the property
// reference cards in their deck.
const MASTERY_CLASSES = new Set<CharacterClass>([
  "barbarian",
  "fighter",
  "paladin",
  "ranger",
  "rogue",
]);

export const weaponMasteries = {
  list(): readonly WeaponMastery[] {
    return ALL;
  },

  findAll({ cls }: { cls: CharacterClass }): readonly WeaponMastery[] {
    return MASTERY_CLASSES.has(cls) ? ALL : [];
  },
};
