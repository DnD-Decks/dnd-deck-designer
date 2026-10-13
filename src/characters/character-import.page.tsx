import { useState } from "react";
import { DeadEnd } from "src/characters/character-dead-end.component";
import { CharacterView } from "src/characters/character-view.component";
import { characters } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { useLocation } from "wouter";
import styles from "./characters.module.css";

function BrokenLink() {
  return (
    <DeadEnd title="This share link doesn't work">
      <p>The link is incomplete or was changed after it was copied.</p>
      <p>Ask for the link again, and make sure it is copied in full.</p>
    </DeadEnd>
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
