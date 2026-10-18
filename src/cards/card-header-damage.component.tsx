import { Icon } from "src/lib/icon.component";
import { WILDCARD_DAMAGE_ICON, damageIcon, diceIcon } from "src/models/spells/spell-icon.model";
import styles from "./card-header-damage.module.css";

// the header has room for one short formula: the first alternative, with the long words abbreviated
// "1d8 + spellcasting ability modifier" is "1d8+MOD"; "6d10 / 5d10 (…)" is "6d10"
export function headerDice(dice: string) {
  return dice
    .split(/[/;(]/)[0]
    .replace(/spellcasting ability modifier/gi, "MOD")
    .replace(/spell level/gi, "SL")
    .replace(/\s*\+\s*/g, "+")
    .trim();
}

// one die icon per die rolled, six at most; each die size gets at least one:
// `2d6` is d6 d6, `12d6` is six d6, `1d10+2d6` is d10 d6 d6, `1` (Blowgun) is none
const MAX_DICE_ICONS = 6;
const DICE_TERM = /(\d+)d(\d+)/g;

function dicePile(dice: string) {
  const terms = [...dice.matchAll(DICE_TERM)].map((m) => ({ count: Number(m[1]), size: m[2] }));
  let room = MAX_DICE_ICONS - terms.length;
  const pile = terms.flatMap(({ count, size }) => {
    const extra = Math.max(0, Math.min(count - 1, room));
    room -= extra;
    return Array.from({ length: 1 + extra }, () => size);
  });
  return pile.slice(0, MAX_DICE_ICONS).flatMap((size, i) => {
    const src = diceIcon(`d${size}`);
    return src ? [{ key: `die-${i + 1}`, src }] : [];
  });
}

// the dice stack into a tower of two rows, the wider one at the bottom:
// 2 is one row, 3 is 1 over 2, 4 is 2 over 2, 5 is 2 over 3
function diceTower<T>(pile: T[]) {
  if (pile.length <= 2) return [pile];
  const top = Math.floor(pile.length / 2);
  return [pile.slice(0, top), pile.slice(top)];
}

function glyphsOf(types: readonly string[]) {
  return types.flatMap((type) => {
    const src = damageIcon(type);
    return src ? [{ key: type, src }] : [];
  });
}

const PHYSICAL_DAMAGE = ["bludgeoning", "piercing", "slashing"];

// one formula that hits for its weapon's physical damage or a magical type reads "force|normal"
// with the magical glyph (Shillelagh: 1d8+MOD, bludgeoning or force); alternative formulas
// split by "/" are not one (Arcane Hand: 5d8 force / 4d6+MOD bludgeoning)
function physicalOrMagical({ dice, types }: Props) {
  if (types.length !== 2 || /[/;]/.test(dice)) return undefined;
  const magical = types.filter((type) => !PHYSICAL_DAMAGE.includes(type));
  return magical.length === 1 ? magical[0] : undefined;
}

// one glyph per damage type when each dice term has its own (Ice Knife: 1d10 piercing + 2d6 cold);
// any other choice of types (Chromatic Orb: 3d8 acid, cold, fire…) shares one wildcard glyph
function typeGlyphs({ dice, types }: Props) {
  const magical = physicalOrMagical({ dice, types });
  if (magical) return { word: `${magical}|normal`, glyphs: glyphsOf([magical]) };
  const terms = [...headerDice(dice).matchAll(DICE_TERM)].length;
  if (types.length > 1 && types.length !== terms) {
    return { word: "varies", glyphs: [{ key: "wildcard", src: WILDCARD_DAMAGE_ICON }] };
  }
  return { word: types.join(" + "), glyphs: glyphsOf(types) };
}

type Props = { dice: string; types: readonly string[] };

export function CardHeaderDamage({ dice, types }: Props) {
  const shown = headerDice(dice);
  const pile = dicePile(shown);
  const { word, glyphs } = typeGlyphs({ dice, types });
  return (
    <section className={styles.damage} aria-label="Damage">
      <span className={styles.damageText}>
        <span className={styles.dice} title={dice}>
          {shown}
        </span>
        <span className={styles.damageType} title={types.join(", ")}>
          {word}
        </span>
      </span>
      {pile.length > 0 && (
        <span className={styles.diceTower}>
          {diceTower(pile).map((row) => (
            <span key={row[0].key} className={styles.diceRow}>
              {row.map(({ key, src }) => (
                <Icon key={key} src={src} label={shown} className={styles.die} decorative />
              ))}
            </span>
          ))}
        </span>
      )}
      {glyphs.length > 0 && (
        <span className={styles.glyphStack}>
          {glyphs.map(({ key, src }) => (
            <Icon key={key} src={src} label={key} className={styles.damageGlyph} decorative />
          ))}
        </span>
      )}
    </section>
  );
}
