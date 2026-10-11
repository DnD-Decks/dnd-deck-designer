import { useMemo, useState } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import { usePrinting } from "src/cards/print.hook";
import { useViewMode } from "src/cards/view-mode.hook";
import type { DeckCard } from "src/decks/deck.model";
import { cardKey, cardName, cardSection, decks } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass };

/** Group cards into ordered sections; deck.model emits cards grouped by section. */
function sections(cards: readonly DeckCard[]) {
  const bySection = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const label = cardSection(card);
    const section = bySection.get(label) ?? [];
    section.push(card);
    bySection.set(label, section);
  }
  return [...bySection.entries()];
}

type SlotProps = {
  card: DeckCard;
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

/** A card on the mat, under a transparent control that picks it up. */
function CardSlot({ card, trigger, onZoom }: SlotProps) {
  return (
    <div className={styles.slot}>
      <DeckCardFace card={card} />
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${cardName(card)}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

function EmptyDeck({ cls, label }: { cls: CharacterClass; label: string }) {
  return (
    <main className={styles.deck} data-class={cls}>
      <div className={styles.emptySlot}>
        <p className={styles.emptyState}>No cards vendored for {label} yet.</p>
      </div>
    </main>
  );
}

export function DeckView({ cls }: Props) {
  const deck = decks.get({ cls });
  const grouped = sections(deck.cards);
  // flattened from the rendered groups, so arrow order is the order you see
  const ordered = grouped.flatMap(([, cards]) =>
    cards.map((card) => ({ key: cardKey(card), card }))
  );
  const { holding, hold, trigger, release, spotlight } = useCardSpotlight({ entries: ordered });
  const { mode, choose } = useViewMode();
  const printing = usePrinting();

  // stable identity: a new array every render would reset the carousel
  const entries = useMemo(
    () =>
      deck.cards.map((card) => ({
        key: cardKey(card),
        card,
        section: cardSection(card),
      })),
    [deck.cards]
  );

  // the deck can change under a held card (browser back through the class hash)
  const [heldClass, setHeldClass] = useState(cls);
  if (heldClass !== cls) {
    setHeldClass(cls);
    release();
  }

  if (deck.cards.length === 0) return <EmptyDeck cls={cls} label={deck.cls.label} />;

  // whatever the chosen view, the printer always gets the grid
  const grid = printing || mode === "grid";

  return (
    <>
      <div className={styles.viewToggle}>
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={mode === "grid"}
          onClick={() => choose("grid")}
        >
          Grid
        </button>
        <button
          type="button"
          className={styles.viewButton}
          aria-pressed={mode === "carousel"}
          onClick={() => choose("carousel")}
        >
          Carousel
        </button>
      </div>

      <main
        className={styles.deck}
        data-class={cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        {grid ? (
          grouped.map(([label, cards]) => (
            <section key={label} className={styles.section} aria-label={label}>
              {/* tally outside the h2: the heading should read "Level 1", not "Level 123 cards" */}
              <header className={styles.sectionTitle}>
                <h2 className={styles.sectionLabel}>{label}</h2>
                <span className={styles.count}>
                  {cards.length} card{cards.length === 1 ? "" : "s"}
                </span>
              </header>
              <div className={styles.cardRow}>
                {cards.map((card) => (
                  <CardSlot
                    key={cardKey(card)}
                    card={card}
                    trigger={trigger(cardKey(card))}
                    onZoom={() => hold(cardKey(card))}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <CardCarousel label={`${deck.cls.label} cards`} entries={entries} />
        )}
      </main>

      {spotlight}
    </>
  );
}
