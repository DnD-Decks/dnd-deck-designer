import { memo, useEffect, useRef } from "react";
import type { CarouselEntry } from "src/cards/card-carousel.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import { centre } from "src/cards/use-carousel-position.hook";
import { cardName } from "src/decks/deck.model";
import styles from "./card-carousel.module.css";

type ThumbProps = {
  entry: CarouselEntry;
  index: number;
  current: boolean;
  onSelect: (index: number) => void;
};

const CarouselThumb = memo(function CarouselThumb({ entry, index, current, onSelect }: ThumbProps) {
  return (
    <button
      type="button"
      className={styles.thumb}
      aria-label={`Go to ${cardName(entry.card)}`}
      aria-current={current}
      onClick={() => onSelect(index)}
    >
      {/* the face and badge are decorative here: the button's label already names the card */}
      <span aria-hidden="true" className={styles.thumbFace}>
        <DeckCardFace card={entry.card} />
      </span>
      {entry.badge !== undefined && (
        <span aria-hidden="true" className={styles.thumbBadge}>
          {entry.badge}
        </span>
      )}
    </button>
  );
});

type ThumbsProps = {
  entries: readonly CarouselEntry[];
  index: number;
  onSelect: (index: number) => void;
};

export function CarouselThumbs({ entries, index, onSelect }: ThumbsProps) {
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    centre({ container: thumbsRef.current, index });
  }, [index]);

  return (
    <div ref={thumbsRef} className={styles.thumbs}>
      {entries.map((entry, i) => (
        <CarouselThumb
          key={entry.key}
          entry={entry}
          index={i}
          current={i === index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
