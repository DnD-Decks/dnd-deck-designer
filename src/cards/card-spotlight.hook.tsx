import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import type { PutBack } from "src/cards/card-spotlight.component";
import { CardSpotlight } from "src/cards/card-spotlight.component";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { DeckEntry } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";

type Held = { index: number; trigger: HTMLElement };

type Options = {
  entries: readonly DeckEntry[];
  /** buttons beside "Put it back" for the held card */
  actions?: (held: { entry: DeckEntry; putBack: PutBack }) => ReactNode;
};

/** Lifts one of `entries` into the spotlight; ← / → step through them in the order given. */
export function useCardSpotlight({ entries, actions }: Options) {
  const triggers = useRef(new Map<string, HTMLElement>());
  const [held, setHeld] = useState<Held | null>(null);
  const release = useCallback(() => setHeld(null), []);

  const holdAt = (index: number) => {
    const entry = entries[index];
    const trigger = entry && triggers.current.get(entry.key);
    if (trigger) setHeld({ index, trigger });
  };

  const neighbour = (index: number) => {
    const entry = entries[index];
    return entry ? { name: cardName(entry.card), hold: () => holdAt(index) } : undefined;
  };

  const trigger = (key: string) => (element: HTMLElement | null) => {
    if (element) triggers.current.set(key, element);
    return () => {
      triggers.current.delete(key);
    };
  };

  const heldEntry = held ? entries[held.index] : undefined;
  const spotlight = held && heldEntry && (
    <CardSpotlight
      label={cardName(heldEntry.card)}
      liftedFrom={held.trigger}
      previous={neighbour(held.index - 1)}
      next={neighbour(held.index + 1)}
      actions={actions && ((putBack) => actions({ entry: heldEntry, putBack }))}
      onClose={release}
    >
      <DeckCardFace card={heldEntry.card} />
    </CardSpotlight>
  );

  return {
    holding: held !== null,
    hold: (key: string) => holdAt(entries.findIndex((entry) => entry.key === key)),
    trigger,
    release,
    spotlight,
  };
}
