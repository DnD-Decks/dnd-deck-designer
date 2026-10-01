import { useId } from "react";
import { Icon } from "src/lib/icon.component";
import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";
import styles from "./character-builder.module.css";

const ALL_CLASSES = classes.list();

type BuilderClassProps = {
  cls: CharacterClass | undefined;
  onChange: (cls: CharacterClass) => void;
};

/**
 * Offers the builder's explicit class selection.
 * - An empty draft has no pressed class.
 * Throws on no expected input.
 */
export function BuilderClass({ cls, onChange }: BuilderClassProps) {
  return (
    <div className={styles.classes} aria-label="Character class">
      {ALL_CLASSES.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={cls === option.id}
          onClick={() => onChange(option.id)}
        >
          <Icon src={option.icon} label={option.label} decorative className={styles.icon} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

type BuilderNameProps = {
  name: string;
  onChange: (name: string) => void;
};

/**
 * Edits the required character name.
 * - Keeps whitespace in the draft until saving.
 * Throws on no expected input.
 */
export function BuilderName({ name, onChange }: BuilderNameProps) {
  const nameId = useId();
  return (
    <>
      <label htmlFor={nameId}>Character name (required)</label>
      <input
        id={nameId}
        className={styles.name}
        value={name}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}
