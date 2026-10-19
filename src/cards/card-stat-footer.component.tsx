import type { ReactNode } from "react";
import { Icon } from "src/lib/icon.component";
import { DURATION_ICON, SAVING_THROW_ICON } from "src/models/spells/spell-icon.model";
import type { Spell } from "src/models/spells/spells.model";
import styles from "./spell-card.module.css";

type StatItemProps = { icon: string; label: string; children: ReactNode };

function StatItem({ icon, label, children }: StatItemProps) {
  return (
    <span className={styles.statItem}>
      <Icon src={icon} label={label} className={styles.statIcon} />
      <span>{children}</span>
    </span>
  );
}

// the footer has one line, so saves use the abilities' standard short form: "Constitution / Wisdom" is "CON / WIS"
const abbreviateSave = (save: string) =>
  save
    .split(" / ")
    .map((ability) => ability.slice(0, 3).toUpperCase())
    .join(" / ");

type Props = Pick<Spell, "duration" | "save">;

export function CardStatFooter({ duration, save }: Props) {
  return (
    <div className={styles.statStrip}>
      <StatItem icon={DURATION_ICON} label="Duration">
        {duration}
      </StatItem>
      {save && (
        <StatItem icon={SAVING_THROW_ICON} label={`${save} saving throw`}>
          {abbreviateSave(save)}
        </StatItem>
      )}
    </div>
  );
}
