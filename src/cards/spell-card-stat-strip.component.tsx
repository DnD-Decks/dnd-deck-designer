import type { ReactNode } from "react";
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

type StatItemProps = { icon: string; label: string; children: ReactNode };

export function StatItem({ icon, label, children }: StatItemProps) {
  return (
    <span className={styles.statItem}>
      <Icon src={icon} label={label} className={styles.statIcon} />
      <span>{children}</span>
    </span>
  );
}

function DamageTypeGlyph({ type }: { type: string }) {
  const src = damageIcon(type);
  if (!src) return <span>{type}</span>;
  return <Icon src={src} label={type} className={styles.statIcon} />;
}

type DamageItemProps = { dice: string; types: readonly string[]; children: ReactNode };

export function DamageItem({ dice, types, children }: DamageItemProps) {
  const diceSrc = diceIcon(dice);
  return (
    <span className={styles.statItem}>
      {diceSrc && <Icon src={diceSrc} label={dice} className={styles.statIcon} />}
      {types.map((type) => (
        <DamageTypeGlyph key={type} type={type} />
      ))}
      <span>{children}</span>
    </span>
  );
}

type Props = Pick<Spell, "range" | "duration" | "save" | "damage">;

export function SpellCardStatStrip({ range, duration, save, damage }: Props) {
  return (
    <div className={styles.statStrip}>
      <StatItem icon={rangeIcon(range)} label="Range">
        {range}
      </StatItem>
      <StatItem icon={DURATION_ICON} label="Duration">
        {duration}
      </StatItem>
      {save && (
        <StatItem icon={SAVING_THROW_ICON} label="Saving throw">
          {save}
        </StatItem>
      )}
      {damage && (
        <DamageItem dice={damage.dice} types={damage.type}>
          {damage.dice}
        </DamageItem>
      )}
    </div>
  );
}
