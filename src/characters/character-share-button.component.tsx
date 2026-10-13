import { useState } from "react";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import styles from "./characters.module.css";

type Shared = { copied: true } | { copied: false; link: string };

function shareLink(character: Character) {
  const base = window.location.href.split("#")[0];
  const code = characters.toShareCode(character);
  return `${base}#/import/${code}`;
}

export function ShareButton({ character }: { character: Character }) {
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
