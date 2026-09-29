import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";

const CHARACTERS_KEY = "dnd-deck-designer:characters";
const PLAY_KEY = "dnd-deck-designer:play";

type PlayState = { spent: string[] };

// storage can be missing or throw (private mode, blocked site data, quota); the app runs without it
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readPlay(): Record<string, PlayState> {
  const value = read(PLAY_KEY);
  return typeof value === "object" && value !== null ? (value as Record<string, PlayState>) : {};
}

export const characterStorage = {
  list(): Character[] {
    const value = read(CHARACTERS_KEY);
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => characters.parse(item) ?? []);
  },

  get(id: string) {
    return characterStorage.list().find((character) => character.id === id);
  },

  /** adds or replaces by id; false when the device would not store it */
  save(character: Character) {
    const others = characterStorage.list().filter(({ id }) => id !== character.id);
    return write(CHARACTERS_KEY, [...others, character]);
  },

  remove(id: string) {
    const { [id]: _, ...play } = readPlay();
    write(PLAY_KEY, play);
    return write(
      CHARACTERS_KEY,
      characterStorage.list().filter((character) => character.id !== id)
    );
  },

  spent(id: string): string[] {
    const spent = readPlay()[id]?.spent;
    return Array.isArray(spent) ? spent.filter((key) => typeof key === "string") : [];
  },

  setSpent(id: string, spent: readonly string[]) {
    return write(PLAY_KEY, { ...readPlay(), [id]: { spent } });
  },
};
