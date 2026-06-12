import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";
import styles from "./class-selector.module.css";

type Props = {
  selected: CharacterClass;
  onSelect: (cls: CharacterClass) => void;
};

// Static data — read once at module level instead of on every render.
const ALL_CLASSES = classes.list();

export function ClassSelector({ selected, onSelect }: Props) {
  return (
    <nav className={styles.selector} aria-label="Character class">
      {ALL_CLASSES.map((cls) => (
        <button
          key={cls.id}
          type="button"
          className={styles.classButton}
          aria-pressed={cls.id === selected}
          onClick={() => onSelect(cls.id)}
        >
          <span className={styles.label}>{cls.label}</span>
          <span className={styles.meta}>
            <span className={styles.classification}>{cls.manualClassification}</span>
            <span className={styles.hitDie}>{cls.hitDie}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
