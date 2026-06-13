import { Icon } from "src/lib/icon.component";
import {
  DURATION_ICON,
  SAVING_THROW_ICON,
  damageIcon,
  diceIcon,
  rangeIcon,
} from "src/models/spells/spell-icon.model";
import type { Spell } from "src/models/spells/spells.model";
import styles from "./spell-card.module.css";

type DamageItemProps = { damage: NonNullable<Spell["damage"]> };

function DamageItem({ damage }: DamageItemProps) {
  const dSrc = diceIcon(damage.dice);
  return (
    <span className={styles.statItem}>
      {dSrc ? <Icon src={dSrc} label={damage.dice} className={styles.statIcon} /> : null}
      {damage.type.map((t) => {
        const src = damageIcon(t);
        return src ? (
          <Icon key={t} src={src} label={t} className={styles.statIcon} />
        ) : (
          <span key={t}>{t}</span>
        );
      })}
      <span>{damage.dice}</span>
    </span>
  );
}

type Props = Pick<Spell, "range" | "duration" | "save" | "damage">;

export function SpellCardStatStrip({ range, duration, save, damage }: Props) {
  return (
    <div className={styles.statStrip}>
      <span className={styles.statItem}>
        <Icon src={rangeIcon(range)} label="Range" className={styles.statIcon} />
        <span>{range}</span>
      </span>
      <span className={styles.statItem}>
        <Icon src={DURATION_ICON} label="Duration" className={styles.statIcon} />
        <span>{duration}</span>
      </span>
      {save ? (
        <span className={styles.statItem}>
          <Icon src={SAVING_THROW_ICON} label="Saving throw" className={styles.statIcon} />
          <span>{save}</span>
        </span>
      ) : null}
      {damage ? <DamageItem damage={damage} /> : null}
    </div>
  );
}
