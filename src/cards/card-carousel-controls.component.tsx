import styles from "./card-carousel.module.css";

type ControlsProps = {
  index: number;
  total: number;
  section?: string;
  onGo: (index: number) => void;
};

export function CarouselControls({ index, total, section, onGo }: ControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.nav}
        aria-label="Previous card"
        disabled={index === 0}
        onClick={() => onGo(index - 1)}
      >
        ‹
      </button>
      <p className={styles.position} aria-live="polite">
        {section ? `${section} · ${index + 1} / ${total}` : null}
      </p>
      <button
        type="button"
        className={styles.nav}
        aria-label="Next card"
        disabled={index >= total - 1}
        onClick={() => onGo(index + 1)}
      >
        ›
      </button>
    </div>
  );
}
