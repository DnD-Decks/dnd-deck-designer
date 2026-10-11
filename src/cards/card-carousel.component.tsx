import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { DeckEntry } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import styles from "./card-carousel.module.css";

export type CarouselEntry = DeckEntry & { section: string };

type Props = {
  /** accessible name of the region, e.g. "Wizard cards" */
  label: string;
  entries: readonly CarouselEntry[];
  /** makes the centred card a button (selection in #329, nudge in the play view); undefined = not tappable */
  card?: (
    entry: CarouselEntry
  ) => { name: string; pressed?: boolean; onTap: () => void } | undefined;
  /** UI rendered under the centred card, outside the card face (play actions) */
  below?: (entry: CarouselEntry) => ReactNode;
};

const clamp = (index: number, length: number) => Math.max(0, Math.min(index, length - 1));

// scroll the container, never scrollIntoView: that one drags the page with it.
// instant, or a second jump during a smooth scroll makes mandatory snap pull
// the track back to the old slide; jsdom has no layout at all
const centre = (container: HTMLElement | null, child: Element | undefined) => {
  if (!container || !child || typeof container.scrollTo !== "function") return;
  const box = container.getBoundingClientRect();
  const item = child.getBoundingClientRect();
  container.scrollTo({
    left: container.scrollLeft + item.left - box.left - (box.width - item.width) / 2,
    behavior: "instant",
  });
};

export function CardCarousel({ label, entries, card, below }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [position, setPosition] = useState(0);

  // callers reset the carousel with a `key` change; the clamp keeps a shrinking
  // deck from pointing past its last card in the meantime
  const index = clamp(position, entries.length);

  const goTo = (i: number) => {
    const next = clamp(i, entries.length);
    indexRef.current = next;
    setPosition(next);
    centre(trackRef.current, trackRef.current?.children[next]);
  };

  // the index follows the swipe: read the scroll position, keep it in the ref,
  // and only re-render when the centred slide actually changes
  const followScroll = () => {
    const track = trackRef.current;
    const slide = track?.children[0];
    if (!track || !slide) return;
    const width = slide.getBoundingClientRect().width;
    if (!width) return;
    const i = clamp(Math.round(track.scrollLeft / width), entries.length);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setPosition(i);
    }
  };

  // keep the current thumbnail on the strip
  useEffect(() => {
    centre(thumbsRef.current, thumbsRef.current?.children[index]);
  }, [index]);

  const step = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  const current = entries[index];

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the region takes focus so ← / → can move between cards
      tabIndex={0}
      onKeyDown={step}
    >
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.nav}
          aria-label="Previous card"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          ‹
        </button>
        <p className={styles.position} aria-live="polite">
          {current ? `${current.section} · ${index + 1} / ${entries.length}` : null}
        </p>
        <button
          type="button"
          className={styles.nav}
          aria-label="Next card"
          disabled={index >= entries.length - 1}
          onClick={() => goTo(index + 1)}
        >
          ›
        </button>
      </div>

      <div ref={trackRef} className={styles.track} onScroll={followScroll}>
        {entries.map((entry, i) => {
          const action = i === index ? card?.(entry) : undefined;
          // a slide is role="group" (APG carousel): <fieldset> is the element for it
          return (
            <fieldset
              key={entry.key}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${entries.length}: ${cardName(entry.card)}`}
              className={styles.slide}
            >
              <div className={styles.slot}>
                <DeckCardFace card={entry.card} />
                {action ? (
                  <button
                    type="button"
                    className={styles.cardTap}
                    aria-label={action.name}
                    aria-pressed={action.pressed}
                    onClick={action.onTap}
                  />
                ) : null}
              </div>
              {below && i === index ? <div className={styles.below}>{below(entry)}</div> : null}
            </fieldset>
          );
        })}
      </div>

      <div ref={thumbsRef} className={styles.thumbs}>
        {entries.map((entry, i) => (
          <button
            key={entry.key}
            type="button"
            className={styles.thumb}
            aria-label={`Go to ${cardName(entry.card)}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
          >
            {/* the face is decorative here: the button's label already names the card */}
            <span aria-hidden="true" className={styles.thumbFace}>
              <DeckCardFace card={entry.card} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
