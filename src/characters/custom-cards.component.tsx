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

  return (
    <div className={styles.row}>
      {entries.map(({ key, card }) => (
        <div key={key} className={styles.slot}>
          <DeckCardFace card={card} />
          <button type="button" className={styles.remove} onClick={() => onRemove(key)}>
            Remove {cardName(card)}
          </button>
        </div>
      ))}
    </div>
  );
}
