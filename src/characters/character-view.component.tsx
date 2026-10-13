import type { ReactNode } from "react";
import { SpotlightAction } from "src/cards/card-spotlight-action.component";
import type { PutBack } from "src/cards/card-spotlight.component";
import { useCardSpotlight } from "src/cards/use-card-spotlight.hook";
import { useDeckLayout } from "src/cards/use-deck-layout.hook";
import { ViewModeToggle } from "src/cards/view-mode-toggle.component";
import { PlayCarousel } from "src/characters/character-play-carousel.component";
import { PlayGrid } from "src/characters/character-play-grid.component";
import { spendLabel } from "src/characters/character-spent-mark.component";
import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckEntry } from "src/decks/deck.model";
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

type HeaderProps = Pick<Props, "character" | "actions" | "menu">;

function PlayHeader({ character, actions, menu }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.back} aria-label="Back to your characters">
        ‹
      </Link>
      <hgroup className={styles.title}>
        <h2 className={styles.name}>{character.name}</h2>
        <p className={styles.subtitle}>{characters.classLine(character)}</p>
      </hgroup>
      <div className={styles.actions}>{actions}</div>
      {menu}
    </header>
  );
}

export function CharacterView({ character, spent = [], onToggleSpent, actions, menu }: Props) {
  const { entries } = decks.forCharacter(character);
  const grouped = play.sections(entries);
  // arrow order is the order you see
  const ordered = grouped.flatMap((section) => section.entries);
  const spentKeys = new Set(spent);

  const spendAction = ({ entry, putBack }: { entry: DeckEntry; putBack: PutBack }) => {
    if (!onToggleSpent || !play.spendable(entry)) return null;
    return (
      <SpotlightAction onClick={() => putBack(() => onToggleSpent(entry.key))}>
        {spendLabel(spentKeys.has(entry.key))}
      </SpotlightAction>
    );
  };

  const { holding, zoom, spotlight } = useCardSpotlight({ entries: ordered, actions: spendAction });
  const { mode, choose, carousel } = useDeckLayout();
  const showCarousel = carousel && !!onToggleSpent && entries.length > 0;

  return (
    <>
      <main
        className={styles.play}
        data-class={character.cls}
        inert={holding}
        aria-hidden={holding || undefined}
      >
        <PlayHeader character={character} actions={actions} menu={menu} />
        {/* the import preview has no onToggleSpent: it only gets the grid, no toggle */}
        {!!onToggleSpent && <ViewModeToggle mode={mode} choose={choose} />}

        {entries.length === 0 && (
          <p className={styles.empty}>
            No cards in this deck yet. Edit the character to pick some.
          </p>
        )}

        {showCarousel && (
          <PlayCarousel
            key={character.id}
            character={character}
            entries={ordered}
            spentKeys={spentKeys}
            onToggleSpent={onToggleSpent}
          />
        )}
        {!showCarousel && <PlayGrid sections={grouped} spentKeys={spentKeys} zoom={zoom} />}
      </main>

      {spotlight}
    </>
  );
}
