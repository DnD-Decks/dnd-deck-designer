import type { ReactNode } from "react";
import { CarouselControls } from "src/cards/card-carousel-controls.component";
import { CarouselTrack } from "src/cards/card-carousel-slide.component";
import { CarouselThumbs } from "src/cards/card-carousel-thumbs.component";
import { useCarouselPosition } from "src/cards/use-carousel-position.hook";
import type { DeckEntry } from "src/decks/deck.model";
import styles from "./card-carousel.module.css";

export type CarouselEntry = DeckEntry & {
  section: string;
  dimmed?: boolean;
  badge?: ReactNode;
};

export type CardAction = { name: string; pressed?: boolean; onTap: () => void };

type Props = {
  label: string;
  entries: readonly CarouselEntry[];
  /** undefined = the centred card is not tappable */
  card?: (entry: CarouselEntry) => CardAction | undefined;
  below?: (entry: CarouselEntry) => ReactNode;
};

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
