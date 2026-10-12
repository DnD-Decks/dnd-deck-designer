import type { ReactNode } from "react";
import { SpotlightAction } from "src/cards/card-spotlight-action.component";
import { useCardSpotlight } from "src/cards/use-card-spotlight.hook";
import { useDeckLayout } from "src/cards/use-deck-layout.hook";
import { ViewModeToggle } from "src/cards/view-mode-toggle.component";
import { PlayCarousel } from "src/characters/character-play-carousel.component";
import { PlayGrid } from "src/characters/character-play-grid.component";
import { spendLabel } from "src/characters/character-spent-mark.component";
import type { Character } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import { decks } from "src/decks/deck.model";
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
  const { mode, choose, carousel } = useDeckLayout();

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
