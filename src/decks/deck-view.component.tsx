import { SpellCard } from "src/cards/spell-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { decks } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass };

function sectionLabel(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : `Level ${card.spell.level}`;
  }
}

function cardKey(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return `spell-${card.spell.id}`;
  }
}

function renderCard(card: DeckCard) {
  switch (card.kind) {
    case "spell":
      return <SpellCard key={cardKey(card)} spell={card.spell} />;
  }
}

/** Group cards into ordered sections; deck.model already sorts cards by level. */
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
        <p className={styles.emptyState}>No cards vendored for {deck.cls.label} yet.</p>
      </main>
    );
  }

  return (
    <main className={styles.deck} data-class={cls}>
      {sections(deck.cards).map(([label, cards]) => (
        <section key={label} className={styles.section}>
          <h2 className={styles.sectionTitle}>{label}</h2>
          <div className={styles.cardRow}>{cards.map(renderCard)}</div>
        </section>
      ))}
    </main>
  );
}
