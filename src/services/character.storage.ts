import type { Character } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import { isRecord, isStringList } from "src/lib/json.guard";
import { localStore } from "src/services/local.storage";

const CHARACTERS_KEY = "dnd-deck-designer:characters";
const PLAY_KEY = "dnd-deck-designer:play";
const LAST_PLAYED_KEY = "dnd-deck-designer:last-played";

type PlayState = { spent: string[] };
type PlayStates = Record<string, PlayState>;

function read(key: string): unknown {
  const raw = localStore.read(key);
  try {
    return raw === undefined ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write({ key, value }: { key: string; value: unknown }) {
  return localStore.write({ key, value: JSON.stringify(value) });
}

function readPlay() {
  const value = read(PLAY_KEY);
  return isRecord(value) ? (value as PlayStates) : {};
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
    if (read(LAST_PLAYED_KEY) === id) write({ key: LAST_PLAYED_KEY, value: null });
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

  lastPlayed() {
    const id = read(LAST_PLAYED_KEY);
    return typeof id === "string" ? characterStorage.get(id) : undefined;
  },

  setLastPlayed(id: string) {
    if (characterStorage.get(id)) write({ key: LAST_PLAYED_KEY, value: id });
  },
};
