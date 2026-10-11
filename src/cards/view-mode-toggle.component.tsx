import type { ViewMode } from "src/cards/view-mode.hook";
import styles from "./view-mode-toggle.module.css";

type Props = {
  mode: ViewMode;
  choose: (mode: ViewMode) => void;
};

export function ViewModeToggle({ mode, choose }: Props) {
  return (
    <div className={styles.viewToggle}>
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={mode === "grid"}
        onClick={() => choose("grid")}
      >
        Grid
      </button>
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={mode === "carousel"}
        onClick={() => choose("carousel")}
      >
        Carousel
      </button>
    </div>
  );
}
