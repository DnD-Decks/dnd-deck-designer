import { useState } from "react";
import type { CarouselEntry } from "src/cards/card-carousel.component";
import { CardCarousel } from "src/cards/card-carousel.component";
import type { Character } from "src/characters/character.model";
import { ClassSelector } from "src/decks/class-selector.component";
import { cardKey, cardName, catalogEntry, decks } from "src/decks/deck.model";
import { useCardSelection } from "src/decks/use-card-selection.hook";
import { classes } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { Link, Redirect, useLocation } from "wouter";
import styles from "./add-cards.module.css";

type Props = {
  id: string;
  cls?: string;
};

function withCustom({ character, keys }: { character: Character; keys: ReadonlySet<string> }) {
  const custom = [...new Set([...(character.picks.custom ?? []), ...keys])];
  return { ...character, picks: { ...character.picks, custom } };
}

function cardBadge({ owned, selected }: { owned: boolean; selected: boolean }) {
  if (owned) return <span className={styles.inDeck}>In deck</span>;
  if (!selected) return undefined;
  return (
    <span className={styles.seal} aria-hidden="true">
      ✓
    </span>
  );
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
    const entry = catalogEntry(card);
    const inDeck = owned.has(entry.key);
    const badge = cardBadge({ owned: inDeck, selected: selected.has(entry.key) });
    return { ...entry, dimmed: inDeck, badge };
  });

  const tapToSelect = ({ key, card }: CarouselEntry) => {
    if (owned.has(key)) return undefined;
    return { name: cardName(card), pressed: selected.has(key), onTap: () => toggle(key) };
  };

  const confirm = () => {
    const saved = characterStorage.save(withCustom({ character, keys: selected }));
    if (saved) navigate(`/character/${id}`, { replace: true });
    else setFailed(true);
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
        card={tapToSelect}
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
