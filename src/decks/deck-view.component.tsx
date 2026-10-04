import { useState } from "react";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { cardKey, cardName, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass };

function sectionLabel(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return "Resources";
    case "feat":
      return "Class Features";
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : `Level ${card.spell.level}`;
    case "weapon":
      return "Weapons";
    default:
      return assertNever(card);
  }
}

/** Group cards into ordered sections; deck.model emits cards grouped by section. */
function sections(cards: readonly DeckCard[]) {
  const bySection = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const label = sectionLabel(card);
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
  const ordered = grouped.flatMap(([, cards]) => cards);
  const { holding, hold, trigger, release, spotlight } = useCardSpotlight(ordered);

  // the deck can change under a held card (browser back through the class hash)
  const [heldClass, setHeldClass] = useState(cls);
  if (heldClass !== cls) {
    setHeldClass(cls);
    release();
  }

  if (deck.cards.length === 0) return <EmptyDeck cls={cls} label={deck.cls.label} />;

  return (
    <>
      <main
        className={styles.deck}
        data-class={cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        {grouped.map(([label, cards]) => (
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
                  trigger={trigger(card)}
                  onZoom={() => hold(card)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {spotlight}
    </>
  );
}
