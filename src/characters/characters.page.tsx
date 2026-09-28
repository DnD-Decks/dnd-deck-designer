import { Link } from "wouter";
import styles from "./characters.module.css";

export function CharactersPage() {
  return (
    <main className={styles.page}>
      <h2 className={styles.heading}>Your characters</h2>
      <div className={styles.empty}>
        <p>No characters yet.</p>
        <p>
          Building a character comes next: pick a class, choose your weapons and spells, and carry
          the deck on your phone. Until then, every class's cards are in the catalog.
        </p>
        <Link href="/catalog" className={styles.action}>
          Open the card catalog
        </Link>
      </div>
    </main>
  );
}
