import type { ReactNode } from "react";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Character } from "src/characters/character.model";
import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import { cardName, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import styles from "./character-view.module.css";

type Props = { character: Character; actions: ReactNode; menu?: ReactNode };

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
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

function CardSlot({ card, trigger, onZoom }: SlotProps) {
  return (
    <div className={styles.slot}>
      <DeckCardFace card={card} />
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${cardName(card)}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

/** The character at the table: name and actions pinned on top, one swipeable row per section. */
export function CharacterView({ character, actions, menu }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const grouped = sections(entries);
  // arrow order is the order you see
  const ordered = grouped.flatMap((section) => section.entries);
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
          {menu}
        </header>

        {grouped.map(({ label, entries }) => (
          <section key={label} className={styles.section} aria-label={label}>
            <h2 className={styles.sectionLabel}>{label}</h2>
            <div className={styles.row}>
              {entries.map(({ key, card }) => (
                <CardSlot key={key} card={card} trigger={trigger(key)} onZoom={() => hold(key)} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {spotlight}
    </>
  );
}
