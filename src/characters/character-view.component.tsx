import { useState } from "react";
import type { ReactNode } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import { SpotlightAction } from "src/cards/card-spotlight.component";
import { useCardSpotlight } from "src/cards/card-spotlight.hook";
import { DeckCardFace } from "src/cards/deck-card.component";
import { usePrinting } from "src/cards/print.hook";
import { ViewModeToggle } from "src/cards/view-mode-toggle.component";
import { useViewMode } from "src/cards/view-mode.hook";
import type { Character } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckCard, DeckEntry } from "src/decks/deck.model";
import { cardName, decks } from "src/decks/deck.model";
import { assertNever } from "src/lib/assert-never";
import { Link } from "wouter";
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
  const spentKeys = new Set(spent);
  const { holding, hold, trigger, spotlight } = useCardSpotlight({
    entries: ordered,
    actions: ({ entry, putBack }) =>
      onToggleSpent &&
      play.spendable(entry) && (
        <SpotlightAction onClick={() => putBack(() => onToggleSpent(entry.key))}>
          {spentKeys.has(entry.key) ? "Recover" : "Spend"}
        </SpotlightAction>
      ),
  });
  const { mode, choose } = useViewMode();
  const printing = usePrinting();

  // a tap on a spendable card pulses the actions under it; `n` remounts the
  // group so the animation restarts on every tap
  const [nudge, setNudge] = useState<{ key: string; n: number } | undefined>();

  // the import preview has no onToggleSpent: it only gets the grid, no toggle
  const carousel = onToggleSpent !== undefined && mode === "carousel" && !printing;

  const slides = ordered.map((entry) => ({
    ...entry,
    section: sectionOf(entry.card),
    dimmed: spentKeys.has(entry.key),
    badge: spentKeys.has(entry.key) ? (
      <span className={styles.spentPill} aria-hidden="true">
        Spent
      </span>
    ) : undefined,
  }));

  return (
    <>
      <main
        className={styles.play}
        data-class={character.cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        <header className={styles.header}>
          <Link href="/" className={styles.back} aria-label="Back to your characters">
            ‹
          </Link>
          <hgroup className={styles.title}>
            <h2 className={styles.name}>{character.name}</h2>
            <p className={styles.subtitle}>
              Level {character.level} {cls.label}
            </p>
          </hgroup>
          <div className={styles.actions}>{actions}</div>
          {menu}
        </header>

        {onToggleSpent ? <ViewModeToggle mode={mode} choose={choose} /> : null}

        {entries.length === 0 && (
          <p className={styles.empty}>
            No cards in this deck yet. Edit the character to pick some.
          </p>
        )}

        {carousel && entries.length > 0 ? (
          <CardCarousel
            key={character.id}
            label={`${character.name}'s cards`}
            entries={slides}
            card={(entry) =>
              play.spendable(entry)
                ? {
                    name: cardName(entry.card) + (spentKeys.has(entry.key) ? ", spent" : ""),
                    onTap: () =>
                      setNudge((now) => ({
                        key: entry.key,
                        n: (now?.key === entry.key ? now.n : 0) + 1,
                      })),
                  }
                : undefined
            }
            below={(entry) => {
              if (!play.spendable(entry)) return null;
              const name = cardName(entry.card);
              const nudged = nudge?.key === entry.key;
              return (
                <fieldset
                  key={nudged ? `nudge-${nudge.n}` : "rest"}
                  className={styles.cardActions}
                  aria-label={`${name} actions`}
                  data-nudge={nudged || undefined}
                >
                  <SpotlightAction onClick={() => onToggleSpent(entry.key)}>
                    {spentKeys.has(entry.key) ? "Recover" : "Spend"}
                  </SpotlightAction>
                </fieldset>
              );
            }}
          />
        ) : (
          grouped.map(({ label, entries }) => (
            <section key={label} className={styles.section} aria-label={label}>
              <h2 className={styles.sectionLabel}>{label}</h2>
              <div className={styles.row}>
                {entries.map(({ key, card }) => (
                  <CardSlot
                    key={key}
                    card={card}
                    spent={spentKeys.has(key)}
                    trigger={trigger(key)}
                    onZoom={() => hold(key)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {spotlight}
    </>
  );
}
