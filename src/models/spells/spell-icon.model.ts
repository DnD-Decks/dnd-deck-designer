export const MANA_ICON = "/icons/mana.png";
export const DURATION_ICON = "/icons/duration.png";
export const SAVING_THROW_ICON = "/icons/saving-throw.png";
export const CONCENTRATION_ICON = "/icons/concentration.png";
export const RITUAL_ICON = "/icons/ritual.png";
export const ATTACK_ROLL_ICON = "/icons/attack-roll.png";

export type IconRef = { src: string; label: string };

export const actionIcon = (castingTime: string): IconRef => {
  const t = castingTime.toLowerCase();
  if (t.includes("bonus")) return { src: "/icons/bonus-action.png", label: castingTime };
  if (t.includes("reaction")) return { src: "/icons/reaction.png", label: castingTime };
  if (t.includes("action")) return { src: "/icons/action.png", label: castingTime };
  return { src: "/icons/duration.png", label: castingTime };
};

export const rangeIcon = (range: string): string => {
  const r = range.toLowerCase();
  if (r === "self" || r === "touch" || r.startsWith("melee")) return "/icons/melee-range.png";
  return "/icons/range.png";
};

const DAMAGE_ICONS: Record<string, string> = {
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
};

export const damageIcon = (type: string): string | undefined => DAMAGE_ICONS[type.toLowerCase()];

const DICE_ICONS: Record<string, string> = {
  "4": "/icons/d4.png",
  "6": "/icons/d6.png",
  "8": "/icons/d8.png",
  "10": "/icons/d10.png",
  "12": "/icons/d12.png",
};

const DICE_PATTERN = /d(\d+)/i;

export const diceIcon = (dice: string): string | undefined => {
  const m = dice.match(DICE_PATTERN);
  return m ? DICE_ICONS[m[1]] : undefined;
};
