import type { CSSProperties, ReactNode } from "react";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Character } from "src/characters/character.model";
import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import { cardKey, cardName, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import styles from "./character-view.module.css";

type Props = { character: Character; actions: ReactNode };

type Stack = { card: DeckCard; copies: number };

const SECTIONS = ["Resources", "Weapons", "Features", "Cantrips", "Spells"] as const;

type Section = (typeof SECTIONS)[number];

function sectionOf(card: DeckCard): Section {
  switch (card.kind) {
    case "resource":
      return "Resources";
    case "weapon":
      return "Weapons";
    case "feat":
      return "Features";
    case "spell":
      return card.spell.level === 0 ? "Cantrips" : "Spells";
    default:
      return assertNever(card);
  }
}

/** copies of one card collapse into a single stack */
function stacks(entries: readonly DeckEntry[]) {
  const copies = new Map<DeckCard, number>();
  for (const { card } of entries) copies.set(card, (copies.get(card) ?? 0) + 1);
  return [...copies].map(([card, count]): Stack => ({ card, copies: count }));
}

function sections(entries: readonly DeckEntry[]) {
  const all = stacks(entries);
  return SECTIONS.map((label) => ({
    label,
    stacks: all.filter(({ card }) => sectionOf(card) === label),
  })).filter((section) => section.stacks.length > 0);
}

type StackSlotProps = {
  stack: Stack;
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

function StackSlot({ stack: { card, copies }, trigger, onZoom }: StackSlotProps) {
  const name = cardName(card);

  return (
    <div className={styles.slot}>
      <div className={styles.stack} style={{ "--depth": copies - 1 } as CSSProperties}>
        {Array.from({ length: copies - 1 }, (_, layer) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: the layers are interchangeable
            key={layer}
            className={styles.under}
            style={{ "--layer": copies - 1 - layer } as CSSProperties}
          />
        ))}
        <DeckCardFace card={card} />
        <button
          type="button"
          className={styles.zoom}
          aria-label={`Zoom ${name}`}
          ref={trigger}
          onClick={onZoom}
        />
      </div>
      {copies > 1 && (
        <p className={styles.left}>
          {copies} of {copies} left
        </p>
      )}
    </div>
  );
}

/** The character at the table: name and actions pinned on top, one swipeable row per section. */
export function CharacterView({ character, actions }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const grouped = sections(entries);
  // arrow order is the order you see
  const ordered = grouped.flatMap((section) => section.stacks.map(({ card }) => card));
  const { holding, hold, trigger, spotlight } = useCardSpotlight(ordered);

  return (
    <>
      <main
        className={styles.play}
        data-class={character.cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        <header className={styles.header}>
          <hgroup className={styles.title}>
            <h2 className={styles.name}>{character.name}</h2>
            <p className={styles.subtitle}>
              Level {character.level} {cls.label}
            </p>
          </hgroup>
          <div className={styles.actions}>{actions}</div>
        </header>

        {grouped.map(({ label, stacks }) => (
          <section key={label} className={styles.section} aria-label={label}>
            <h2 className={styles.sectionLabel}>{label}</h2>
            <div className={styles.row}>
              {stacks.map((stack) => (
                <StackSlot
                  key={cardKey(stack.card)}
                  stack={stack}
                  trigger={trigger(stack.card)}
                  onZoom={() => hold(stack.card)}
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
