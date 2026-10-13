import type { ReactNode, Ref } from "react";
import { memo } from "react";
import type { CardAction, CarouselEntry } from "src/cards/card-carousel.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import { cardName } from "src/decks/deck.model";
import styles from "./card-carousel.module.css";

function CardTap({ action }: { action: CardAction }) {
  return (
    <button
      type="button"
      className={styles.cardTap}
      aria-label={action.name}
      aria-pressed={action.pressed}
      onClick={action.onTap}
    />
  );
}

type SlideProps = {
  entry: CarouselEntry;
  index: number;
  total: number;
  /** not rendered — part of the memo key so the slides that flip to or from centred re-render */
  current: boolean;
  action?: CardAction;
  below?: ReactNode;
};

// a slide is role="group" (APG carousel): <fieldset> is the element for it
const CarouselSlide = memo(function CarouselSlide({
  entry,
  index,
  total,
  action,
  below,
}: SlideProps) {
  return (
    <fieldset
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${cardName(entry.card)}`}
      className={styles.slide}
    >
      <div className={styles.slot}>
        <div className={styles.face} data-dimmed={entry.dimmed || undefined}>
          <DeckCardFace card={entry.card} />
        </div>
        {entry.badge}
        {action && <CardTap action={action} />}
      </div>
      {below && <div className={styles.below}>{below}</div>}
    </fieldset>
  );
});

type TrackProps = {
  trackRef: Ref<HTMLDivElement>;
  entries: readonly CarouselEntry[];
  index: number;
  card?: (entry: CarouselEntry) => CardAction | undefined;
  below?: (entry: CarouselEntry) => ReactNode;
  onScroll: () => void;
};

export function CarouselTrack({ trackRef, entries, index, card, below, onScroll }: TrackProps) {
  return (
    <div ref={trackRef} className={styles.track} onScroll={onScroll}>
      {entries.map((entry, i) => (
        <CarouselSlide
          key={entry.key}
          entry={entry}
          index={i}
          total={entries.length}
          current={i === index}
          action={i === index ? card?.(entry) : undefined}
          below={i === index ? below?.(entry) : undefined}
        />
      ))}
    </div>
  );
}
