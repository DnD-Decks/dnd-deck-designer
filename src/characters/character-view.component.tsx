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

type Nudge = { key: string; n: number };

const spendLabel = (spent: boolean) => (spent ? "Recover" : "Spend");
const withSpent = (name: string, spent: boolean) => (spent ? `${name}, spent` : name);
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

/** the aria-hidden "Spent" mark — a label over a grid card, a pill over a slide */
function SpentMark({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      Spent
    </span>
  );
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
      {spent && <SpentMark className={styles.spentLabel} />}
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${withSpent(cardName(card), spent)}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

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

type HeaderProps = {
  character: Character;
  classLabel: string;
  actions: ReactNode;
  menu?: ReactNode;
};

function PlayHeader({ character, classLabel, actions, menu }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.back} aria-label="Back to your characters">
        ‹
      </Link>
      <hgroup className={styles.title}>
        <h2 className={styles.name}>{character.name}</h2>
        <p className={styles.subtitle}>
          Level {character.level} {classLabel}
        </p>
      </hgroup>
      <div className={styles.actions}>{actions}</div>
      {menu}
    </header>
  );
}

type GridProps = {
  sections: ReturnType<typeof play.sections>;
  spentKeys: ReadonlySet<string>;
  trigger: (key: string) => SlotProps["trigger"];
  hold: (key: string) => void;
};

function PlayGrid({ sections, spentKeys, trigger, hold }: GridProps) {
  return (
    <>
      {sections.map(({ label, entries }) => (
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
      ))}
    </>
  );
}

type CarouselProps = {
  character: Character;
  entries: readonly DeckEntry[];
  spentKeys: ReadonlySet<string>;
  onToggleSpent: (key: string) => void;
};

function PlayCarousel({ character, entries, spentKeys, onToggleSpent }: CarouselProps) {
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

/** The character at the table: name and actions pinned on top, cards on a mat or a carousel. */
export function CharacterView({ character, spent = [], onToggleSpent, actions, menu }: Props) {
  const { cls, entries } = decks.forCharacter(character);
  const grouped = play.sections(entries);
  // arrow order is the order you see
  const ordered = grouped.flatMap((section) => section.entries);
  const spentKeys = new Set(spent);
  const { holding, hold, trigger, spotlight } = useCardSpotlight({
    entries: ordered,
    actions: ({ entry, putBack }) =>
      onToggleSpent &&
      play.spendable(entry) && (
        <SpotlightAction onClick={() => putBack(() => onToggleSpent(entry.key))}>
          {spendLabel(spentKeys.has(entry.key))}
        </SpotlightAction>
      ),
  });
  const { mode, choose } = useViewMode();
  const printing = usePrinting();
  const carousel = mode === "carousel" && !printing;

  return (
    <>
      <main
        className={styles.play}
        data-class={character.cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        <PlayHeader character={character} classLabel={cls.label} actions={actions} menu={menu} />
        {/* the import preview has no onToggleSpent: it only gets the grid, no toggle */}
        {!!onToggleSpent && <ViewModeToggle mode={mode} choose={choose} />}

        {entries.length === 0 && (
          <p className={styles.empty}>
            No cards in this deck yet. Edit the character to pick some.
          </p>
        )}

        {carousel && onToggleSpent && entries.length > 0 ? (
          <PlayCarousel
            key={character.id}
            character={character}
            entries={ordered}
            spentKeys={spentKeys}
            onToggleSpent={onToggleSpent}
          />
        ) : (
          <PlayGrid sections={grouped} spentKeys={spentKeys} trigger={trigger} hold={hold} />
        )}
      </main>

      {spotlight}
    </>
  );
}
