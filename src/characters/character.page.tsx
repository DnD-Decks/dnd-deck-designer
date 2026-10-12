import { useEffect } from "react";
import { CharacterMenu } from "src/characters/character-menu.component";
import { Rests } from "src/characters/character-rests.component";
import { CharacterView } from "src/characters/character-view.component";
import type { Character } from "src/characters/character.model";
import { usePlayState } from "src/characters/use-play-state.hook";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./characters.module.css";

function PlayTable({ character }: { character: Character }) {
  const { entries, spent, status, toggleSpent, rest } = usePlayState(character);

  return (
    <CharacterView
      character={character}
      spent={spent}
      onToggleSpent={toggleSpent}
      actions={<Rests entries={entries} spent={spent} status={status} onRest={rest} />}
      menu={<CharacterMenu character={character} />}
    />
  );
}

export function CharacterPage({ id }: { id: string }) {
  const character = characterStorage.get(id);
  useEffect(() => {
    characterStorage.setLastPlayed(id);
  }, [id]);

  if (!character) {
    return (
      <main className={styles.page}>
        <h2 className={styles.heading}>Character not found</h2>
        <div className={styles.empty}>
          <p>This device has no character with that link.</p>
          <Link href="/" className={styles.action}>
            Back to your characters
          </Link>
        </div>
      </main>
    );
  }

  return <PlayTable character={character} />;
}
