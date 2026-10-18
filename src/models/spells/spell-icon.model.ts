import { ACTION_TIMING_ICONS } from "src/models/actions/combat.model";
import { WILDCARD_DAMAGE } from "src/models/damage/header-damage.model";

export const DURATION_ICON = "/icons/duration.png";
export const SAVING_THROW_ICON = "/icons/saving-throw.png";
export const CONCENTRATION_ICON = "/icons/concentration.png";
export const RITUAL_ICON = "/icons/ritual.png";

export const actionIcon = (castingTime: string) => {
  const t = castingTime.toLowerCase();
  if (t.includes("bonus")) return { src: ACTION_TIMING_ICONS["bonus-action"], label: castingTime };
  if (t.includes("reaction")) return { src: ACTION_TIMING_ICONS.reaction, label: castingTime };
  if (t.includes("action")) return { src: ACTION_TIMING_ICONS.action, label: castingTime };
  // long-cast times (minutes, hours) have no action-economy glyph — render nothing
  return undefined;
};

export const rangeIcon = (range: string) => {
  const r = range.toLowerCase();
  if (r === "self" || r === "touch" || r.startsWith("melee")) return "/icons/melee-range.png";
  return "/icons/range.png";
};

const DAMAGE_ICONS: Partial<Record<string, string>> = {
  acid: "/icons/damage-acid.png",
  bludgeoning: "/icons/damage-bludgeoning.png",
  cold: "/icons/damage-cold.png",
  fire: "/icons/damage-fire.png",
  force: "/icons/damage-force.png",
  lightning: "/icons/damage-lightning.png",
  necrotic: "/icons/damage-necrotic.png",
  piercing: "/icons/damage-piercing.png",
  poison: "/icons/damage-poison.png",
  psychic: "/icons/damage-psychic.png",
  radiant: "/icons/damage-radiant.png",
  slashing: "/icons/damage-slashing.png",
  thunder: "/icons/damage-thunder.png",
  [WILDCARD_DAMAGE]: "/icons/damage-wildcard.svg",
};

export const damageIcon = (type: string) => DAMAGE_ICONS[type.toLowerCase()];

const DICE_ICONS: Partial<Record<string, string>> = {
  "4": "/icons/d4.png",
  "6": "/icons/d6.png",
  "8": "/icons/d8.png",
  "10": "/icons/d10.png",
  "12": "/icons/d12.png",
};

export const dieIcon = (size: string) => DICE_ICONS[size];
