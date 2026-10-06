import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CharacterView } from "src/characters/character-view.component";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckEntry } from "src/decks/deck.model";
import { decks } from "src/decks/deck.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { characterStorage } from "src/services/character.storage";
import { Link, useLocation } from "wouter";
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

const REST_LABELS: Record<RestType, string> = {
  "short-rest": "Short rest",
  "long-rest": "Long rest",
};

// joinWithAnd(["Second Wind", "Mana", "Rage"]) is "Second Wind, Mana and Rage".
function joinWithAnd(names: readonly string[]) {
  const last = names[names.length - 1];
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${last}` : (last ?? "");
}

function restHint({ entries, rest }: { entries: readonly DeckEntry[]; rest: RestType }) {
  if (rest === "long-rest") return "Everything";
  return joinWithAnd(play.restores({ entries, rest })) || "Nothing";
}

type RestProps = {
  rest: RestType;
  hint: string;
  disabled: boolean;
  onRest: (rest: RestType) => void;
};

function RestButton({ rest, hint, disabled, onRest }: RestProps) {
  const hintId = useId();

  return (
    <button
      type="button"
      className={styles.rest}
      disabled={disabled}
      aria-describedby={hintId}
      onClick={() => onRest(rest)}
    >
      {REST_LABELS[rest]}
      <span id={hintId} className={styles.restHint} aria-hidden="true">
        {hint}
      </span>
    </button>
  );
}

type RestsProps = {
  entries: readonly DeckEntry[];
  spent: readonly string[];
  status: string;
  onRest: (rest: RestType) => void;
};

function Rests({ entries, spent, status, onRest }: RestsProps) {
  return (
    <>
      <div className={styles.rests}>
        {(["short-rest", "long-rest"] as const).map((rest) => (
          <RestButton
            key={rest}
            rest={rest}
            hint={restHint({ entries, rest })}
            disabled={play.recovered({ entries, spent, rest }).length === 0}
            onRest={onRest}
          />
        ))}
      </div>
      <output className={styles.restStatus}>{status}</output>
    </>
  );
}

function usePlayState(character: Character) {
  const { entries } = decks.forCharacter(character);
  const [spent, setSpent] = useState(() => characterStorage.spent(character.id));
  const [status, setStatus] = useState("");

  const save = (next: readonly string[]) => {
    setSpent([...next]);
    characterStorage.setSpent({ id: character.id, spent: next });
  };

  return {
    entries,
    spent,
    status,
    toggleSpent(key: string) {
      save(spent.includes(key) ? spent.filter((k) => k !== key) : [...spent, key]);
      setStatus("");
    },
    rest(rest: RestType) {
      const recovered = play.recovered({ entries, spent, rest });
      const back = new Set(recovered.map((entry) => entry.key));
      save(spent.filter((key) => !back.has(key)));
      setStatus(`${REST_LABELS[rest]}: ${joinWithAnd(play.names(recovered))} recovered`);
    },
  };
}

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

type ConfirmProps = { name: string; onCancel: () => void; onDelete: () => void };

// open, not showModal(): jsdom 26 has no showModal. Portalled out of the header,
// whose backdrop-filter would otherwise pin the fixed scrim to the header box.
function ConfirmDelete({ name, onCancel, onDelete }: ConfirmProps) {
  const titleId = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => cancel.current?.focus(), []);

  return createPortal(
    <div className={styles.scrim}>
      <dialog
        open
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.confirm}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
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

function CharacterMenu({ character }: { character: Character }) {
  const menuId = useId();
  const [confirming, setConfirming] = useState(false);
  const [, navigate] = useLocation();

  const remove = () => {
    characterStorage.remove(character.id);
    navigate("/");
  };

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
        <hr className={styles.menuRule} />
        <Link href="/" className={styles.menuItem}>
          Your characters
        </Link>
        <Link href="/catalog" className={styles.menuItem}>
          Card catalog
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
          onCancel={() => setConfirming(false)}
          onDelete={remove}
        />
      )}
    </>
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
