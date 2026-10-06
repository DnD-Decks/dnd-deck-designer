import type { ReactNode } from "react";
import { SpotlightAction } from "src/cards/card-spotlight.component";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Character } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import { cardName, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import styles from "./character-view.module.css";

type Props = {
  character: Character;
  spent?: readonly string[];
  /** without it the cards are only for looking at, as in the import preview */
  onToggleSpent?: (key: string) => void;
  actions: ReactNode;
  menu?: ReactNode;
};

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

function sections(entries: readonly DeckEntry[]) {
  return SECTIONS.map((label) => ({
    label,
    entries: entries.filter(({ card }) => sectionOf(card) === label),
  })).filter((section) => section.entries.length > 0);
}

type SlotProps = {
  card: DeckCard;
  spent: boolean;
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

function CardSlot({ card, spent, trigger, onZoom }: SlotProps) {
  return (
    <div className={styles.slot} data-spent={spent || undefined}>
      <div className={styles.face}>
        <DeckCardFace card={card} />
      </div>
      {spent && (
        <span className={styles.spentLabel} aria-hidden="true">
          Spent
        </span>
      )}
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${cardName(card)}${spent ? ", spent" : ""}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

/** The character at the table: name and actions pinned on top, one swipeable row per section. */
export function CharacterView({ character, spent = [], onToggleSpent, actions, menu }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const grouped = sections(entries);
  // arrow order is the order you see
  const ordered = grouped.flatMap((section) => section.entries);
  const { holding, hold, trigger, spotlight } = useCardSpotlight({
    entries: ordered,
    actions: ({ entry, putBack }) =>
      onToggleSpent &&
      play.spendable(entry) && (
        <SpotlightAction onClick={() => putBack(() => onToggleSpent(entry.key))}>
          {spent.includes(entry.key) ? "Recover" : "Spend"}
        </SpotlightAction>
      ),
  });

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
          {menu}
        </header>

        {grouped.map(({ label, entries }) => (
          <section key={label} className={styles.section} aria-label={label}>
            <h2 className={styles.sectionLabel}>{label}</h2>
            <div className={styles.row}>
              {entries.map(({ key, card }) => (
                <CardSlot
                  key={key}
                  card={card}
                  spent={spent.includes(key)}
                  trigger={trigger(key)}
                  onZoom={() => hold(key)}
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
