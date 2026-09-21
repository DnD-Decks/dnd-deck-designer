import { useState } from "react";
import styles from "./card-art.module.css";

type Props = {
  /** File name under public/art/, without extension — see ARCHITECTURE.md § Art assets. */
  assetId: string;
};

/**
 * Full-card background painting. The card's chrome sits on top of it.
 * When the file is missing the image unmounts itself, so the card's colour
 * wash shows through — no broken-image glyph, no layout shift.
 */
export function CardArt({ assetId }: Props) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;

  return (
    <img
      src={`/art/${assetId}.png`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={styles.art}
      onError={() => setMissing(true)}
    />
  );
}
