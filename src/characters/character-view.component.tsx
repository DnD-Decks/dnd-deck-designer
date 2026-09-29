import type { ReactNode } from "react";
import type { Character } from "src/characters/character.model";
import { DeckView } from "src/decks/deck-view.component";
import { decks } from "src/decks/deck.model";
import styles from "./characters.module.css";

type Props = { character: Character; actions: ReactNode };

export function CharacterView({ character, actions }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const cards = [...new Set(entries.map(({ card }) => card))];

  return (
    <>
      <header className={styles.sheetHeader}>
        <div>
          <h2 className={styles.heading}>{character.name}</h2>
          <p className={styles.subtitle}>
            Level {character.level} {cls.label}
          </p>
        </div>
        <div className={styles.actions}>{actions}</div>
      </header>
      <DeckView cls={character.cls} cards={cards} />
    </>
  );
}
