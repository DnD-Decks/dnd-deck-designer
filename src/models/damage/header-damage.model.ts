import type { DamageType } from "src/models/damage/damage-types.model";
import { dicePile, diceTerms } from "src/models/damage/dice-pile.model";

export const WILDCARD_DAMAGE = "wildcard";

const PHYSICAL_DAMAGE: readonly string[] = [
  "bludgeoning",
  "piercing",
  "slashing",
] satisfies DamageType[];

type Damage = { dice: string; types: readonly string[] };

export const headerDice = (dice: string) =>
  dice
    .split(/\s*[/;]|\s\(/)[0]
    .replace(/spellcasting ability modifier/gi, "MOD")
    .replace(/spell level/gi, "SL")
    .replace(/\s*\+\s*/g, "+")
    .trim();

// Shillelagh deals its weapon's damage or force; Arcane Hand's force and bludgeoning
// belong to two formulas split by "/", so it is not this case
function physicalOrMagical({ dice, types }: Damage) {
  if (types.length !== 2 || /[/;]/.test(dice)) return undefined;
  const magical = types.filter((type) => !PHYSICAL_DAMAGE.includes(type));
  return magical.length === 1 ? magical[0] : undefined;
}

// Ice Knife's "1d10 + 2d6" pairs piercing and cold term by term
const pairedWithTerms = ({ dice, types }: Damage) =>
  types.length === diceTerms(headerDice(dice)).length;

function damageTypes({ dice, types }: Damage) {
  if (types.length === 1 || pairedWithTerms({ dice, types })) {
    return { word: types.join(" + "), glyphs: [...types] };
  }
  const magical = physicalOrMagical({ dice, types });
  if (magical) return { word: `${magical} | normal`, glyphs: [magical] };
  return { word: "varies", glyphs: [WILDCARD_DAMAGE] };
}

export function headerDamage({ dice, types }: Damage) {
  const shown = headerDice(dice);
  return { shown, pile: dicePile(shown), ...damageTypes({ dice, types }) };
}
