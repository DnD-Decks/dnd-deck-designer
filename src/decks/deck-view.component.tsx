import { Fragment } from "react";
import { SpellCard } from "src/cards/spell-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass };

function sectionLabel(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : `Level ${card.spell.level}`;
    default:
      return assertNever(card.kind);
  }
}

function cardKey(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return `spell-${card.spell.id}`;
    default:
      return assertNever(card.kind);
  }
}

function renderCard(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return <SpellCard spell={card.spell} />;
    default:
      return assertNever(card.kind);
  }
}

/** Group cards into ordered sections; deck.model emits cards grouped by ascending level. */
function sections(cards: DeckCard[]) {
  const bySection = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const label = sectionLabel(card);
    const section = bySection.get(label) ?? [];
    section.push(card);
    bySection.set(label, section);
  }
  return [...bySection.entries()];
}

export function DeckView({ cls }: Props) {
  const deck = decks.get({ cls });

  if (deck.cards.length === 0) {
    return (
      <main className={styles.deck} data-class={cls}>
        <div className={styles.emptySlot}>
          <p className={styles.emptyState}>No cards vendored for {deck.cls.label} yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.deck} data-class={cls}>
      {sections(deck.cards).map(([label, cards]) => (
        <section key={label} className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {label}
            <span className={styles.count}>{cards.length} cards</span>
          </h2>
          <div className={styles.cardRow}>
            {cards.map((card) => (
              <Fragment key={cardKey(card)}>{renderCard(card)}</Fragment>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
