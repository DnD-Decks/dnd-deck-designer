import { useCallback, useRef, useState } from "react";
import { CardSpotlight } from "src/cards/card-spotlight.component";
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

type Held = { index: number; trigger: HTMLElement };

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

function cardName(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return card.resource.name;
    case "feat":
      return card.feat.name;
    case "spell":
      return card.spell.name;
    case "weapon-mastery":
      return card.mastery.name;
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

type SlotProps = {
  card: DeckCard;
  triggers: Map<string, HTMLButtonElement>;
  onZoom: () => void;
};

/** A card on the mat, under a transparent control that picks it up. */
function CardSlot({ card, triggers, onZoom }: SlotProps) {
  const key = cardKey(card);

  return (
    <div className={styles.slot}>
      {renderCard(card)}
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${cardName(card)}`}
        ref={(element) => {
          if (element) triggers.set(key, element);
          return () => {
            triggers.delete(key);
          };
        }}
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
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const [held, setHeld] = useState<Held | null>(null);
  const putBack = useCallback(() => setHeld(null), []);

  // the deck can change under a held card (browser back through the class hash)
  const [heldClass, setHeldClass] = useState(cls);
  if (heldClass !== cls) {
    setHeldClass(cls);
    setHeld(null);
  }

  const hold = (index: number) => {
    const card = ordered[index];
    const trigger = card && triggers.current.get(cardKey(card));
    if (trigger) setHeld({ index, trigger });
  };

  const neighbour = (index: number) => {
    const card = ordered[index];
    return card ? { name: cardName(card), hold: () => hold(index) } : undefined;
  };

  const heldCard = held ? ordered[held.index] : undefined;

  if (deck.cards.length === 0) return <EmptyDeck cls={cls} label={deck.cls.label} />;

  return (
    <>
      <main
        className={styles.deck}
        data-class={cls}
        inert={held !== null}
        aria-hidden={held !== null || undefined}
      >
        {grouped.map(([label, cards]) => (
          <section key={label} className={styles.section} aria-label={label}>
            {/* tally outside the h2: the heading should read "Level 1", not "Level 123 cards" */}
            <header className={styles.sectionTitle}>
              <h2 className={styles.sectionLabel}>{label}</h2>
              <span className={styles.count}>{cards.length} cards</span>
            </header>
            <div className={styles.cardRow}>
              {cards.map((card) => (
                <CardSlot
                  key={cardKey(card)}
                  card={card}
                  triggers={triggers.current}
                  onZoom={() => hold(ordered.indexOf(card))}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {held && heldCard && (
        <CardSpotlight
          label={cardName(heldCard)}
          liftedFrom={held.trigger}
          previous={neighbour(held.index - 1)}
          next={neighbour(held.index + 1)}
          onClose={putBack}
        >
          {renderCard(heldCard)}
        </CardSpotlight>
      )}
    </>
  );
}
