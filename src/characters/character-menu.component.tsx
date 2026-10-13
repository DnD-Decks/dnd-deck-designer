import type { RefObject } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShareButton } from "src/characters/character-share-button.component";
import type { Character } from "src/characters/character.model";
import { useModal } from "src/lib/use-modal.hook";
import { characterStorage } from "src/services/character.storage";
import { Link, useLocation } from "wouter";
import styles from "./characters.module.css";

type ConfirmProps = {
  name: string;
  returnFocusTo: RefObject<HTMLElement | null>;
  onCancel: () => void;
  onDelete: () => void;
};

// open, not showModal(): jsdom 26 has no showModal. Portalled out of the header,
// whose backdrop-filter would otherwise pin the fixed scrim to the header box.
function ConfirmDelete({ name, returnFocusTo, onCancel, onDelete }: ConfirmProps) {
  const titleId = useId();
  const scrim = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useModal({ scrim, onCancel });

  useEffect(() => {
    cancel.current?.focus();
    return () => returnFocusTo.current?.focus();
  }, [returnFocusTo]);

  return createPortal(
    <div ref={scrim} className={styles.scrim}>
      <dialog open aria-modal="true" aria-labelledby={titleId} className={styles.confirm}>
        <h2 id={titleId} className={styles.confirmTitle}>
          Delete {name}?
        </h2>
        <p className={styles.status}>
          Their deck and play state leave this device. A share link can still bring them back.
        </p>
        <div className={styles.confirmActions}>
          <button ref={cancel} type="button" className={styles.action} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.danger} onClick={onDelete}>
            Delete {name}
          </button>
        </div>
      </dialog>
    </div>,
    document.body
  );
}

export function CharacterMenu({ character }: { character: Character }) {
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const cancel = useCallback(() => setConfirming(false), []);
  const [, navigate] = useLocation();

  const remove = () => {
    characterStorage.remove(character.id);
    navigate("/");
  };

  return (
    <>
      <button ref={menuButton} type="button" className={styles.menuButton} popoverTarget={menuId}>
        Menu
      </button>
      <nav id={menuId} popover="auto" className={styles.menu} aria-label="Character menu">
        <Link href={`/character/${character.id}/edit`} className={styles.menuItem}>
          Edit
        </Link>
        <ShareButton character={character} />
        <hr className={styles.menuRule} />
        <Link href="/" className={styles.menuItem}>
          Your characters
        </Link>
        <Link href="/catalog" className={styles.menuItem}>
          Card catalog
        </Link>
        <Link href={`/character/${character.id}/add`} className={styles.menuItem}>
          Add cards
        </Link>
        <hr className={styles.menuRule} />
        <button
          type="button"
          className={styles.menuItem}
          data-danger
          popoverTarget={menuId}
          popoverTargetAction="hide"
          onClick={() => setConfirming(true)}
        >
          Delete character
        </button>
      </nav>
      {confirming && (
        <ConfirmDelete
          name={character.name}
          returnFocusTo={menuButton}
          onCancel={cancel}
          onDelete={remove}
        />
      )}
    </>
  );
}
