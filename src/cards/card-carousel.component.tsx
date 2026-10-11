import type { ReactNode, Ref } from "react";
import { memo, useEffect, useRef } from "react";
import { centre, useCarouselPosition } from "src/cards/card-carousel.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { DeckEntry } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import styles from "./card-carousel.module.css";

export type CarouselEntry = DeckEntry & {
  section: string;
  dimmed?: boolean;
  badge?: ReactNode;
};

type CardAction = { name: string; pressed?: boolean; onTap: () => void };

type Props = {
  label: string;
  entries: readonly CarouselEntry[];
  /** undefined = the centred card is not tappable */
  card?: (entry: CarouselEntry) => CardAction | undefined;
  below?: (entry: CarouselEntry) => ReactNode;
};

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
        {action ? <CardTap action={action} /> : null}
      </div>
      {below ? <div className={styles.below}>{below}</div> : null}
    </fieldset>
  );
});

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

type ControlsProps = {
  index: number;
  total: number;
  section?: string;
  onGo: (index: number) => void;
};

function CarouselControls({ index, total, section, onGo }: ControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.nav}
        aria-label="Previous card"
        disabled={index === 0}
        onClick={() => onGo(index - 1)}
      >
        ‹
      </button>
      <p className={styles.position} aria-live="polite">
        {section ? `${section} · ${index + 1} / ${total}` : null}
      </p>
      <button
        type="button"
        className={styles.nav}
        aria-label="Next card"
        disabled={index >= total - 1}
        onClick={() => onGo(index + 1)}
      >
        ›
      </button>
    </div>
  );
}

type TrackProps = {
  trackRef: Ref<HTMLDivElement>;
  entries: readonly CarouselEntry[];
  index: number;
  card?: Props["card"];
  below?: Props["below"];
  onScroll: () => void;
};

function CarouselTrack({ trackRef, entries, index, card, below, onScroll }: TrackProps) {
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

type ThumbsProps = {
  entries: readonly CarouselEntry[];
  index: number;
  onSelect: (index: number) => void;
};

function CarouselThumbs({ entries, index, onSelect }: ThumbsProps) {
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    centre(thumbsRef.current, thumbsRef.current?.children[index]);
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

export function CardCarousel({ label, entries, card, below }: Props) {
  const { index, goTo, trackRef, followScroll, step } = useCarouselPosition({
    length: entries.length,
  });

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the region takes focus so ← / → can move between cards
      tabIndex={0}
      onKeyDown={step}
    >
      <CarouselControls
        index={index}
        total={entries.length}
        section={entries[index]?.section}
        onGo={goTo}
      />
      <CarouselTrack
        trackRef={trackRef}
        entries={entries}
        index={index}
        card={card}
        below={below}
        onScroll={followScroll}
      />
      <CarouselThumbs entries={entries} index={index} onSelect={goTo} />
    </section>
  );
}
