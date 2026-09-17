import { Fragment } from "react";
import { FeatCard } from "src/cards/feat-card.component";
import { ResourceCard } from "src/cards/resource-card.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponMasteryCard } from "src/cards/weapon-mastery-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { decks } from "src/decks/deck.model";
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
    case "weapon-mastery":
      return "Weapon Masteries";
    default:
      return assertNever(card);
  }
}

function cardKey(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return `resource-${card.resource.id}`;
    case "feat":
      return `feat-${card.feat.id}`;
    case "spell":
      return `spell-${card.spell.id}`;
    case "weapon-mastery":
      return `mastery-${card.mastery.id}`;
    default:
      return assertNever(card);
  }
}

function renderCard(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return <ResourceCard resource={card.resource} />;
    case "feat":
      return <FeatCard feat={card.feat} />;
    case "spell":
      return <SpellCard spell={card.spell} />;
    case "weapon-mastery":
      return <WeaponMasteryCard mastery={card.mastery} />;
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
        <section key={label} className={styles.section} aria-label={label}>
          {/* tally outside the h2: the heading should read "Level 1", not "Level 123 cards" */}
          <header className={styles.sectionTitle}>
            <h2 className={styles.sectionLabel}>{label}</h2>
            <span className={styles.count}>{cards.length} cards</span>
          </header>
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
