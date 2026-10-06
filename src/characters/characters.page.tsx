import { type CSSProperties, useId } from "react";
import { DeckCardFace } from "src/cards/deck-card.component";
import type { Character } from "src/characters/character.model";
import type { DeckEntry } from "src/decks/deck.model";
import { cardKey, cardName, decks } from "src/decks/deck.model";
import { classes } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./characters.module.css";

const HAND = ["resource", "weapon", "spell"] as const;

const classLine = (character: Character) =>
  `Level ${character.level} ${classes.get({ id: character.cls }).label}`;

// feats are landscape and would break the fan, so the hand is portrait cards only
function hand(entries: readonly DeckEntry[]) {
  const cards = [...new Set(entries.map(({ card }) => card))].filter(({ kind }) => kind !== "feat");
  const firsts = HAND.flatMap((kind) => cards.find((card) => card.kind === kind) ?? []);
  const rest = cards.filter((card) => !firsts.includes(card));
  return [...firsts, ...rest].slice(0, HAND.length);
}

function spentNames({ id, entries }: { id: string; entries: readonly DeckEntry[] }) {
  const spent = new Set(characterStorage.spent(id));
  const names = entries.filter(({ key }) => spent.has(key)).map(({ card }) => cardName(card));
  return [...new Set(names)];
}

function Hand({ entries }: { entries: readonly DeckEntry[] }) {
  const cards = hand(entries);
  const middle = (cards.length - 1) / 2;

  return (
    <div className={styles.fan} aria-hidden="true">
      {cards.map((card, index) => (
        <div
          key={cardKey(card)}
          className={styles.fanCard}
          style={{ "--slot": index - middle, "--lift": Math.abs(index - middle) } as CSSProperties}
        >
          <DeckCardFace card={card} />
        </div>
      ))}
    </div>
  );
}

function ContinueCard({ character }: { character: Character }) {
  const { entries } = decks.forCharacter(character);
  const spent = spentNames({ id: character.id, entries });

  return (
    <Link
      href={`/character/${character.id}`}
      className={styles.hero}
      aria-label={`Continue as ${character.name}`}
    >
      <Hand entries={entries} />
      <span className={styles.heroText}>
        <span className={styles.heroName}>{character.name}</span>
        <span className={styles.subtitle}>{classLine(character)}</span>
        {spent.length > 0 && (
          <span className={styles.spent}>Spent until a rest: {spent.join(", ")}</span>
        )}
        <span className={styles.continue}>Continue</span>
      </span>
    </Link>
  );
}

function CharacterList({ title, list }: { title?: string; list: readonly Character[] }) {
  return (
    <section className={styles.others} aria-label={title}>
      <div className={styles.othersHeader}>
        {title && <h2 className={styles.othersHeading}>{title}</h2>}
        <Link href="/new" className={styles.action}>
          New character
        </Link>
      </div>
      {list.length > 0 && (
        <ul className={styles.list}>
          {list.map((character) => (
            <li key={character.id}>
              <Link href={`/character/${character.id}`} className={styles.item}>
                <span className={styles.itemName}>{character.name}</span>
                <span className={styles.subtitle}>{classLine(character)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  const headingId = useId();

  return (
    <section className={styles.empty} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.emptyHeading}>
        Build a character to bring to the table
      </h2>
      <p>Pick a class, choose your weapons and spells, and carry the deck on your phone.</p>
      <div className={styles.emptyActions}>
        <Link href="/new" className={styles.primary}>
          New character
        </Link>
        <Link href="/catalog" className={styles.quiet}>
          Open the card catalog
        </Link>
      </div>
    </section>
  );
}

export function CharactersPage() {
  const saved = characterStorage.list();
  const active = characterStorage.lastPlayed();
  const others = saved.filter(({ id }) => id !== active?.id);

  return (
    <main className={styles.page}>
      {saved.length === 0 && <EmptyState />}
      {active && <ContinueCard character={active} />}
      {active && (
        <CharacterList title={others.length > 0 ? "Other characters" : undefined} list={others} />
      )}
      {!active && saved.length > 0 && <CharacterList title="Pick a character" list={saved} />}
    </main>
  );
}
