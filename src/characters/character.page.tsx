import { useEffect } from "react";
import { CharacterNotFound } from "src/characters/character-dead-end.component";
import { CharacterMenu } from "src/characters/character-menu.component";
import { Rests } from "src/characters/character-rests.component";
import { CharacterView } from "src/characters/character-view.component";
import type { Character } from "src/characters/character.model";
import { usePlayState } from "src/characters/use-play-state.hook";
import { characterStorage } from "src/services/character.storage";

function PlayTable({ character }: { character: Character }) {
  const { entries, spent, status, toggleSpent, rest } = usePlayState(character);

  return (
    <CharacterView
      character={character}
      spent={spent}
      onToggleSpent={toggleSpent}
      actions={<Rests entries={entries} spent={spent} status={status} onRest={rest} />}
      menu={<CharacterMenu character={character} />}
    />
  );
}

export function CharacterPage({ id }: { id: string }) {
  const character = characterStorage.get(id);
  useEffect(() => {
    characterStorage.setLastPlayed(id);
  }, [id]);

  if (!character) return <CharacterNotFound />;
  return <PlayTable character={character} />;
}
