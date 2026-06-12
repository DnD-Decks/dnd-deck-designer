import type { Spell } from "src/models/spells/spells.model";
import styles from "./spell-card.module.css";

const levelLabel = (level: Spell["level"]) => (level === 0 ? "Cantrip" : `Level ${level}`);

const levelBadge = (level: Spell["level"]) => (level === 0 ? "C" : String(level));

type Props = { spell: Spell };

export function SpellCard({ spell }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.titleBar}>
        <span className={styles.name}>{spell.name}</span>
        <span className={styles.levelBadge}>{levelBadge(spell.level)}</span>
      </div>

      <div className={styles.typeLine}>
        {spell.school} · {levelLabel(spell.level)}
      </div>

      <div className={styles.textBox}>
        <p>{spell.description}</p>
      </div>
    </div>
  );
}
