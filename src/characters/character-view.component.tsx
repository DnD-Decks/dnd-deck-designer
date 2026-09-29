import type { ReactNode } from "react";
import type { Character } from "src/characters/character.model";
import { DeckView } from "src/decks/deck-view.component";
import { decks } from "src/decks/deck.model";
import styles from "./characters.module.css";

type Props = { character: Character; actions: ReactNode };

function CharacterHeader({
  title,
  subtitle,
  actions,
}: { title: string; subtitle: string; actions: ReactNode }) {
  return (
    <header className={styles.sheetHeader}>
      <hgroup>
        <h2 className={styles.heading}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </hgroup>
      <div className={styles.actions}>{actions}</div>
    </header>
  );
}

export function CharacterView({ character, actions }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const cards = [...new Set(entries.map(({ card }) => card))];
  const header = (
    <CharacterHeader
      title={character.name}
      subtitle={`Level ${character.level} ${cls.label}`}
      actions={actions}
    />
  );

  return <DeckView cls={character.cls} cards={cards} intro={header} />;
}
