import { useState } from "react";
import { CardCarousel } from "src/cards/card-carousel.component";
import type { Character } from "src/characters/character.model";
import { ClassSelector } from "src/decks/class-selector.component";
import { cardKey, cardName, cardSection, decks } from "src/decks/deck.model";
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

/** Pick any catalog card for a character: swipe a class deck, tap the centred card to mark it. */
export function AddCardsPage({ id, cls }: Props) {
  const character = characterStorage.get(id);
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
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
      badge: owned.has(key) ? (
        <span className={styles.inDeck}>In deck</span>
      ) : selected.has(key) ? (
        <span className={styles.seal} aria-hidden="true">
          ✓
        </span>
      ) : undefined,
    };
  });

  const toggle = (key: string) =>
    setSelected((now) => {
      const next = new Set(now);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const confirm = () => {
    if (!characterStorage.save(withCustom(character, selected))) {
      setFailed(true);
      return;
    }
    navigate(`/character/${id}`);
  };

  return (
    <main className={styles.page} data-class={found.id}>
      <ClassSelector
        selected={found.id}
        onSelect={(next) => navigate(`/character/${id}/add/${next}`)}
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
        <Link href={`/character/${id}`} className={styles.cancel}>
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
