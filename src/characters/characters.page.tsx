import { classes } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./characters.module.css";

function EmptyState() {
  return (
    <div className={styles.empty}>
      <p>No characters yet.</p>
      <p>
        Pick a class, choose your weapons and spells, and carry the deck on your phone. Every
        class's cards are also in the catalog.
      </p>
      <Link href="/catalog" className={styles.action}>
        Open the card catalog
      </Link>
    </div>
  );
}

export function CharactersPage() {
  const saved = characterStorage.list();

  return (
    <main className={styles.page}>
      <h2 className={styles.heading}>Your characters</h2>
      <Link href="/new" className={styles.action}>
        New character
      </Link>
      {saved.length === 0 && <EmptyState />}
      {saved.length > 0 && (
        <ul className={styles.list}>
          {saved.map((character) => (
            <li key={character.id}>
              <Link href={`/character/${character.id}`} className={styles.item}>
                <span className={styles.itemName}>{character.name}</span>
                <span className={styles.subtitle}>
                  Level {character.level} {classes.get({ id: character.cls }).label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
