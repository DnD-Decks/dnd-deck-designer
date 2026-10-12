import { useState } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import { SpotlightAction } from "src/cards/card-spotlight-action.component";
import { SpentMark, spendLabel, withSpent } from "src/characters/character-spent-mark.component";
import type { Character } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckEntry } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import styles from "./character-view.module.css";

type Nudge = { key: string; n: number };

const nextNudge = (now: Nudge | undefined, key: string) => ({
  key,
  n: (now?.key === key ? now.n : 0) + 1,
});

const toSlides = (entries: readonly DeckEntry[], spentKeys: ReadonlySet<string>) =>
  entries.map((entry) => ({
    ...entry,
    section: play.sectionOf(entry.card),
    dimmed: spentKeys.has(entry.key),
    badge: spentKeys.has(entry.key) ? <SpentMark className={styles.spentPill} /> : undefined,
  }));

type ActionsProps = {
  name: string;
  spent: boolean;
  /** set while this card's group is pulsing — also the remount key that restarts the animation */
  nudgeN?: number;
  onToggle: () => void;
  onNudgeEnd: () => void;
};

function CardActions({ name, spent, nudgeN, onToggle, onNudgeEnd }: ActionsProps) {
  return (
    <fieldset
      key={nudgeN === undefined ? "rest" : `nudge-${nudgeN}`}
      className={styles.cardActions}
      aria-label={`${name} actions`}
      data-nudge={nudgeN === undefined ? undefined : true}
      onAnimationEnd={onNudgeEnd}
    >
      <SpotlightAction onClick={onToggle}>{spendLabel(spent)}</SpotlightAction>
    </fieldset>
  );
}

type CarouselProps = {
  character: Character;
  entries: readonly DeckEntry[];
  spentKeys: ReadonlySet<string>;
  onToggleSpent: (key: string) => void;
};

export function PlayCarousel({ character, entries, spentKeys, onToggleSpent }: CarouselProps) {
  // a tap on a spendable card pulses the actions under it; `n` remounts the
  // group so the animation restarts on every tap
  const [nudge, setNudge] = useState<Nudge | undefined>();
  const slides = toSlides(entries, spentKeys);

  return (
    <CardCarousel
      label={`${character.name}'s cards`}
      entries={slides}
      card={(entry) =>
        play.spendable(entry)
          ? {
              name: withSpent(cardName(entry.card), spentKeys.has(entry.key)),
              onTap: () => setNudge((now) => nextNudge(now, entry.key)),
            }
          : undefined
      }
      below={(entry) => {
        if (!play.spendable(entry)) return null;
        const name = cardName(entry.card);
        return (
          <CardActions
            name={name}
            spent={spentKeys.has(entry.key)}
            nudgeN={nudge?.key === entry.key ? nudge.n : undefined}
            onToggle={() => onToggleSpent(entry.key)}
            onNudgeEnd={() => setNudge(undefined)}
          />
        );
      }}
    />
  );
}
