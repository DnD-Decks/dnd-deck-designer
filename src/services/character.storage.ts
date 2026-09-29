import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";

const CHARACTERS_KEY = "dnd-deck-designer:characters";
const PLAY_KEY = "dnd-deck-designer:play";

type PlayState = { spent: string[] };
type PlayStates = Record<string, PlayState>;

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// localStorage throws in private mode, with site data blocked, or over quota
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write({ key, value }: { key: string; value: unknown }) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readPlay() {
  const value = read(PLAY_KEY);
  return typeof value === "object" && value !== null ? (value as PlayStates) : {};
}

function withoutPlay(id: string) {
  const { [id]: _, ...rest } = readPlay();
  return rest;
}

export const characterStorage = {
  list() {
    const value = read(CHARACTERS_KEY);
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => characters.parse(item) ?? []);
  },

  get(id: string) {
    return characterStorage.list().find((character) => character.id === id);
  },

  save(character: Character) {
    const others = characterStorage.list().filter(({ id }) => id !== character.id);
    return write({ key: CHARACTERS_KEY, value: [...others, character] });
  },

  remove(id: string) {
    write({ key: PLAY_KEY, value: withoutPlay(id) });
    const kept = characterStorage.list().filter((character) => character.id !== id);
    return write({ key: CHARACTERS_KEY, value: kept });
  },

  spent(id: string) {
    const spent = readPlay()[id]?.spent;
    return isStringList(spent) ? spent : [];
  },

  setSpent({ id, spent }: { id: string; spent: readonly string[] }) {
    return write({ key: PLAY_KEY, value: { ...readPlay(), [id]: { spent } } });
  },
};
