import { type ReactNode, useCallback, useRef, useState } from "react";
import { CardSpotlight } from "src/cards/card-spotlight.component";
import { FeatCard } from "src/cards/feat-card.component";
import { ResourceCard } from "src/cards/resource-card.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponCard } from "src/cards/weapon-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { cardKey, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import type { CharacterClass } from "src/models/class/classes.model";
import styles from "./deck-view.module.css";

type Props = { cls: CharacterClass; cards?: readonly DeckCard[]; intro?: ReactNode };

type Held = { index: number; trigger: HTMLElement };

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

function cardName(card: DeckCard) {
  switch (card.kind) {
    case "resource":
      return card.resource.name;
    case "feat":
      return card.feat.name;
    case "spell":
      return card.spell.name;
    case "weapon":
      return card.weapon.name;
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
    case "weapon":
      return <WeaponCard weapon={card.weapon} />;
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

export function DeckView({ cls, cards, intro }: Props) {
  const deck = decks.get({ cls });
  const shown = cards ?? deck.cards;
  const grouped = sections(shown);
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

  if (shown.length === 0) return <EmptyDeck cls={cls} label={deck.cls.label} />;

  return (
    <>
      <main
        className={styles.deck}
        data-class={cls}
        inert={held !== null}
        aria-hidden={held !== null || undefined}
      >
        {intro}
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
