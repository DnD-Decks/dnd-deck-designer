import type { ViewMode } from "src/cards/use-view-mode.hook";
import styles from "./view-mode-toggle.module.css";

type Props = {
  mode: ViewMode;
  choose: (mode: ViewMode) => void;
};

const MODES: { mode: ViewMode; label: string }[] = [
  { mode: "grid", label: "Grid" },
  { mode: "carousel", label: "Carousel" },
];

export function ViewModeToggle({ mode, choose }: Props) {
  return (
    <fieldset className={styles.viewToggle} aria-label="View">
      {MODES.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={styles.viewButton}
          aria-pressed={mode === option.mode}
          onClick={() => choose(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
