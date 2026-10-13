import { CardZoom } from "src/cards/card-zoom.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Zoom } from "src/cards/use-card-spotlight.hook";
import { SpentMark, withSpent } from "src/characters/character-spent-mark.component";
import type { play } from "src/characters/play.model";
import type { DeckCard } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import styles from "./character-view.module.css";

type SlotProps = { card: DeckCard; spent: boolean; zoom: Zoom };

function CardSlot({ card, spent, zoom }: SlotProps) {
  return (
    <div className={styles.slot} data-spent={spent || undefined}>
      <div className={styles.face}>
        <DeckCardFace card={card} />
      </div>
      {spent && <SpentMark className={styles.spentLabel} />}
      <CardZoom
        name={withSpent({ name: cardName(card), spent })}
        className={styles.zoom}
        zoom={zoom}
      />
    </div>
  );
}

type GridProps = {
  sections: ReturnType<typeof play.sections>;
  spentKeys: ReadonlySet<string>;
  zoom: (key: string) => Zoom;
};

export function PlayGrid({ sections, spentKeys, zoom }: GridProps) {
  return (
    <>
      {sections.map(({ label, entries }) => (
        <section key={label} className={styles.section} aria-label={label}>
          <h2 className={styles.sectionLabel}>{label}</h2>
          <div className={styles.row}>
            {entries.map(({ key, card }) => (
              <CardSlot key={key} card={card} spent={spentKeys.has(key)} zoom={zoom(key)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
