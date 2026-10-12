import { useEffect, useState } from "react";
import type { Character } from "src/characters/character.model";
import { play } from "src/characters/play.model";
import type { DeckEntry } from "src/decks/deck.model";
import { decks } from "src/decks/deck.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { characterStorage } from "src/services/character.storage";

// a card removed in Edit and added back later must not come back spent
function savedSpent({ id, entries }: { id: string; entries: readonly DeckEntry[] }) {
  const inDeck = new Set(entries.map((entry) => entry.key));
  return characterStorage.spent(id).filter((key) => inDeck.has(key));
}

export function usePlayState(character: Character) {
  const { id } = character;
  const { entries } = decks.forCharacter(character);
  const [spent, setSpent] = useState(() => savedSpent({ id, entries }));
  const [status, setStatus] = useState("");

  useEffect(() => {
    characterStorage.setSpent({ id, spent });
  }, [id, spent]);

  return {
    entries,
    spent,
    status,
    toggleSpent(key: string) {
      setSpent((now) => (now.includes(key) ? now.filter((k) => k !== key) : [...now, key]));
      setStatus("");
    },
    rest(rest: RestType) {
      const recovered = play.recovered({ entries, spent, rest });
      const back = new Set(recovered.map((entry) => entry.key));
      setSpent((now) => now.filter((key) => !back.has(key)));
      setStatus(play.restStatus({ rest, recovered }));
    },
  };
}
