import { useId, useState } from "react";
import { CharacterView } from "src/characters/character-view.component";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./characters.module.css";

type Shared = { copied: true } | { copied: false; link: string };

function shareLink(character: Character) {
  const base = window.location.href.split("#")[0];
  const code = characters.toShareCode(character);
  return `${base}#/import/${code}`;
}

function ShareButton({ character }: { character: Character }) {
  const [shared, setShared] = useState<Shared | null>(null);

  const share = async () => {
    const link = shareLink(character);
    try {
      await navigator.clipboard.writeText(link);
      setShared({ copied: true });
    } catch {
      setShared({ copied: false, link });
    }
  };

  return (
    <>
      <button type="button" className={styles.menuItem} onClick={share}>
        Share
      </button>
      <output className={styles.status}>
        {shared?.copied && "Link copied. Open it on another device to import this character."}
        {shared?.copied === false && "Couldn't copy the link. Copy it from here:"}
      </output>
      {shared?.copied === false && (
        <input
          className={styles.linkField}
          aria-label="Share link"
          readOnly
          value={shared.link}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </>
  );
}

// recovering spent cards arrives with spending (#262); until then there is nothing to rest for
function Rests() {
  return (
    <div className={styles.rests}>
      <button type="button" className={styles.rest} disabled title="Nothing spent yet">
        Short rest
      </button>
      <button type="button" className={styles.rest} disabled title="Nothing spent yet">
        Long rest
      </button>
    </div>
  );
}

function CharacterMenu({ character }: { character: Character }) {
  const menuId = useId();

  return (
    <>
      <button type="button" className={styles.menuButton} popoverTarget={menuId}>
        Menu
      </button>
      <nav id={menuId} popover="auto" className={styles.menu} aria-label="Character menu">
        <Link href={`/character/${character.id}/edit`} className={styles.menuItem}>
          Edit
        </Link>
        <ShareButton character={character} />
        <Link href="/" className={styles.menuItem}>
          Your characters
        </Link>
        <Link href="/catalog" className={styles.menuItem}>
          Card catalog
        </Link>
      </nav>
    </>
  );
}

export function CharacterPage({ id }: { id: string }) {
  const character = characterStorage.get(id);

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

  return (
    <CharacterView
      character={character}
      actions={<Rests />}
      menu={<CharacterMenu character={character} />}
    />
  );
}
