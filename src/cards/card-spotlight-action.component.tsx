import type { ReactNode } from "react";
import styles from "./card-spotlight.module.css";

type ActionProps = { onClick: () => void; children: ReactNode };

/** A button for the `actions` slot, styled to sit beside "Put it back". */
export function SpotlightAction({ onClick, children }: ActionProps) {
  return (
    <button type="button" className={styles.action} onClick={onClick}>
      {children}
    </button>
  );
}
