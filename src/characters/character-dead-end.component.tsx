import type { ReactNode } from "react";
import { Link } from "wouter";
import styles from "./characters.module.css";

/** A page whose only way out is home: an unknown character, a broken share link. */
export function DeadEnd({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.empty}>
        {children}
        <Link href="/" className={styles.action}>
          Back to your characters
        </Link>
      </div>
    </main>
  );
}

export function CharacterNotFound() {
  return (
    <DeadEnd title="Character not found">
      <p>This device has no character with that link.</p>
    </DeadEnd>
  );
}
