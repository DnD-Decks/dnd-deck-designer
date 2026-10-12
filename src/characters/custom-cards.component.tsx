import { useEffect, useRef } from "react";
import { DeckCardFace } from "src/cards/deck-card.component";
import { cardName, decks } from "src/decks/deck.model";
import styles from "./custom-cards.module.css";

type Props = {
  /** the `picks.custom` card keys */
  keys: readonly string[];
  onRemove: (key: string) => void;
};

/** The cards a character picked up by hand in the catalog, each with its way back out. */
export function CustomCards({ keys, onRemove }: Props) {
  const entries = keys.flatMap((key) => {
    const card = decks.findCard({ key });
    return card ? [{ key, card }] : [];
  });
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const refocus = useRef<string | undefined>(undefined);

  const remove = (index: number, key: string) => {
    refocus.current = entries[index + 1]?.key ?? entries[index - 1]?.key;
    onRemove(key);
  };

  // keyed on keys: the refocus lands after the list re-renders without the removed card
  // biome-ignore lint/correctness/useExhaustiveDependencies: keys is the trigger, not a read
  useEffect(() => {
    const key = refocus.current;
    refocus.current = undefined;
    if (key) buttons.current.get(key)?.focus();
  }, [keys]);

  return (
    <ul className={styles.row}>
      {entries.map(({ key, card }, index) => (
        <li key={key} className={styles.slot}>
          <DeckCardFace card={card} />
          <button
            type="button"
            className={styles.remove}
            ref={(node) => {
              if (node) buttons.current.set(key, node);
              else buttons.current.delete(key);
            }}
            onClick={() => remove(index, key)}
          >
            Remove {cardName(card)}
          </button>
        </li>
      ))}
    </ul>
  );
}
