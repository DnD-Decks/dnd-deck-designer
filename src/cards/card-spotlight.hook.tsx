import { useCallback, useRef, useState } from "react";
import { CardSpotlight } from "src/cards/card-spotlight.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { DeckCard } from "src/decks/deck.model";
import { cardKey, cardName } from "src/decks/deck.model";

type Held = { index: number; trigger: HTMLElement };

/** Lifts one of `cards` into the spotlight; ← / → step through them in the order given. */
export function useCardSpotlight(cards: readonly DeckCard[]) {
  const triggers = useRef(new Map<string, HTMLElement>());
  const [held, setHeld] = useState<Held | null>(null);
  const release = useCallback(() => setHeld(null), []);

  const holdAt = (index: number) => {
    const card = cards[index];
    const trigger = card && triggers.current.get(cardKey(card));
    if (trigger) setHeld({ index, trigger });
  };

  const neighbour = (index: number) => {
    const card = cards[index];
    return card ? { name: cardName(card), hold: () => holdAt(index) } : undefined;
  };

  const trigger = (card: DeckCard) => (element: HTMLElement | null) => {
    const key = cardKey(card);
    if (element) triggers.current.set(key, element);
    return () => {
      triggers.current.delete(key);
    };
  };

  const heldCard = held ? cards[held.index] : undefined;
  const spotlight = held && heldCard && (
    <CardSpotlight
      label={cardName(heldCard)}
      liftedFrom={held.trigger}
      previous={neighbour(held.index - 1)}
      next={neighbour(held.index + 1)}
      onClose={release}
    >
      <DeckCardFace card={heldCard} />
    </CardSpotlight>
  );

  return {
    holding: held !== null,
    hold: (card: DeckCard) => holdAt(cards.indexOf(card)),
    trigger,
    release,
    spotlight,
  };
}
