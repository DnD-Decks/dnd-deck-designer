import { Icon } from "src/lib/icon.component";
import { rangeIcon } from "src/models/spells/spell-icon.model";
import styles from "./spell-card.module.css";

export function CardRange({ range }: { range: string }) {
  return (
    <span className={styles.range}>
      <span className={styles.tag}>
        <Icon src={rangeIcon(range)} label="Range" className={styles.tagIcon} />
      </span>
      {range}
    </span>
  );
}
