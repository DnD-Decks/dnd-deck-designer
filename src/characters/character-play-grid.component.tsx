import { DeckCardFace } from "src/cards/deck-card.component";
import { SpentMark, withSpent } from "src/characters/character-spent-mark.component";
import type { play } from "src/characters/play.model";
import type { DeckCard } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import styles from "./character-view.module.css";

type SlotProps = {
  card: DeckCard;
  spent: boolean;
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

function CardSlot({ card, spent, trigger, onZoom }: SlotProps) {
  return (
    <div className={styles.slot} data-spent={spent || undefined}>
      <div className={styles.face}>
        <DeckCardFace card={card} />
      </div>
      {spent && <SpentMark className={styles.spentLabel} />}
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${withSpent(cardName(card), spent)}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

type GridProps = {
  sections: ReturnType<typeof play.sections>;
  spentKeys: ReadonlySet<string>;
  trigger: (key: string) => SlotProps["trigger"];
  hold: (key: string) => void;
};

export function PlayGrid({ sections, spentKeys, trigger, hold }: GridProps) {
  return (
    <>
      {sections.map(({ label, entries }) => (
        <section key={label} className={styles.section} aria-label={label}>
          <h2 className={styles.sectionLabel}>{label}</h2>
          <div className={styles.row}>
            {entries.map(({ key, card }) => (
              <CardSlot
                key={key}
                card={card}
                spent={spentKeys.has(key)}
                trigger={trigger(key)}
                onZoom={() => hold(key)}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
