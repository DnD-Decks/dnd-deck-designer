import { Icon } from "src/lib/icon.component";
import { diceTower } from "src/models/damage/dice-pile.model";
import { headerDamage } from "src/models/damage/header-damage.model";
import { damageIcon, dieIcon } from "src/models/spells/spell-icon.model";
import styles from "./card-header-damage.module.css";

type IconEntry = { key: string; src: string };

const dieIcons = (pile: readonly string[]) =>
  pile.flatMap((size, i): IconEntry[] => {
    const src = dieIcon(size);
    return src ? [{ key: `die-${i + 1}`, src }] : [];
  });

const glyphIcons = (glyphs: readonly string[]) =>
  glyphs.flatMap((glyph): IconEntry[] => {
    const src = damageIcon(glyph);
    return src ? [{ key: glyph, src }] : [];
  });

type Props = { dice: string; types: readonly string[] };

export function CardHeaderDamage({ dice, types }: Props) {
  const { shown, pile, word, glyphs } = headerDamage({ dice, types });
  const dieEntries = dieIcons(pile);
  const glyphEntries = glyphIcons(glyphs);
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
      {dieEntries.length > 0 && (
        <span className={styles.diceTower}>
          {diceTower(dieEntries).map((row) => (
            <span key={row[0].key} className={styles.diceRow}>
              {row.map(({ key, src }) => (
                <Icon key={key} src={src} label={shown} className={styles.die} decorative />
              ))}
            </span>
          ))}
        </span>
      )}
      {glyphEntries.length > 0 && (
        <span className={styles.glyphStack}>
          {glyphEntries.map(({ key, src }) => (
            <Icon key={key} src={src} label={key} className={styles.damageGlyph} decorative />
          ))}
        </span>
      )}
    </section>
  );
}
