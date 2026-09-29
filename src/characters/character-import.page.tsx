import { useState } from "react";
import { CharacterView } from "src/characters/character-view.component";
import { characters } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { Link, useLocation } from "wouter";
import styles from "./characters.module.css";

function BrokenLink() {
  return (
    <main className={styles.page}>
      <h2 className={styles.heading}>This share link doesn't work</h2>
      <div className={styles.empty}>
        <p>The link is incomplete or was changed after it was copied.</p>
        <p>Ask for the link again, and make sure it is copied in full.</p>
        <Link href="/" className={styles.action}>
          Back to your characters
        </Link>
      </div>
    </main>
  );
}

export function CharacterImportPage({ code }: { code: string }) {
  const [, navigate] = useLocation();
  const [character] = useState(() => characters.fromShareCode(code));
  const [failed, setFailed] = useState(false);

  if (!character) return <BrokenLink />;

  const save = () => {
    if (characterStorage.save(character)) navigate(`/character/${character.id}`, { replace: true });
    else setFailed(true);
  };

  return (
    <CharacterView
      character={character}
      actions={
        <>
          <button type="button" className={styles.action} onClick={save}>
            Save to this device
          </button>
          {failed && (
            <p role="alert" className={styles.status}>
              Couldn't save: this browser is blocking storage for this site.
            </p>
          )}
        </>
      }
    />
  );
}
