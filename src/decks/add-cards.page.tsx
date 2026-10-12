import { useState } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import type { Character } from "src/characters/character.model";
import { ClassSelector } from "src/decks/class-selector.component";
import { cardKey, cardName, cardSection, decks } from "src/decks/deck.model";
import { useCardSelection } from "src/decks/use-card-selection.hook";
import { classes } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { Link, Redirect, useLocation } from "wouter";
import styles from "./add-cards.module.css";

type Props = {
  id: string;
  cls?: string;
};

function withCustom(character: Character, keys: ReadonlySet<string>): Character {
  return {
    ...character,
    picks: {
      ...character.picks,
      custom: [...new Set([...(character.picks.custom ?? []), ...keys])],
    },
  };
}

function cardBadge({ owned, selected }: { owned: boolean; selected: boolean }) {
  return owned ? (
    <span className={styles.inDeck}>In deck</span>
  ) : selected ? (
    <span className={styles.seal} aria-hidden="true">
      ✓
    </span>
  ) : undefined;
}

export function AddCardsPage({ id, cls }: Props) {
  const character = characterStorage.get(id);
  const [, navigate] = useLocation();
  const { selected, toggle } = useCardSelection();
  const [failed, setFailed] = useState(false);

  if (!character) return <Redirect to="/" replace />;
  if (!cls) return <Redirect to={`/character/${id}/add/${character.cls}`} replace />;

  const found = classes.find({ id: cls });
  if (!found) return <Redirect to={`/character/${id}/add/${character.cls}`} replace />;

  const owned = new Set(decks.forCharacter(character).entries.map((e) => cardKey(e.card)));

  const entries = decks.get({ cls: found.id }).cards.map((card) => {
    const key = cardKey(card);
    return {
      key,
      card,
      section: cardSection(card),
      dimmed: owned.has(key),
      badge: cardBadge({ owned: owned.has(key), selected: selected.has(key) }),
    };
  });

  const confirm = () => {
    if (!characterStorage.save(withCustom(character, selected))) {
      setFailed(true);
      return;
    }
    navigate(`/character/${id}`, { replace: true });
  };

  return (
    <main className={styles.page} data-class={found.id} aria-labelledby="add-cards-heading">
      <h2 id="add-cards-heading" className={styles.title}>
        Add cards to {character.name}
      </h2>
      <ClassSelector
        selected={found.id}
        onSelect={(next) => navigate(`/character/${id}/add/${next}`, { replace: true })}
      />
      <CardCarousel
        key={found.id}
        label={`${found.label} cards`}
        entries={entries}
        card={(entry) =>
          owned.has(entry.key)
            ? undefined
            : {
                name: cardName(entry.card),
                pressed: selected.has(entry.key),
                onTap: () => toggle(entry.key),
              }
        }
      />
      <div className={styles.bar}>
        {failed && (
          <p role="alert" className={styles.alert}>
            Couldn't save. Check your browser storage and try again.
          </p>
        )}
        <Link href={`/character/${id}`} replace className={styles.cancel}>
          Cancel
        </Link>
        {selected.size > 0 && (
          <button type="button" className={styles.confirm} onClick={confirm}>
            Add to {character.name} ({selected.size})
          </button>
        )}
      </div>
    </main>
  );
}
