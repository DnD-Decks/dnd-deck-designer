import { choices } from "../characters/choices.model.ts";
import { classes } from "../models/class/classes.model.ts";

import type { ChoiceRuleId } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";

export type CharacterLevel = 1;

/** picked ids per choice rule */
export type Picks = Readonly<Partial<Record<ChoiceRuleId, readonly string[]>>>;

export type Character = {
  id: string;
  name: string;
  cls: CharacterClass;
  level: CharacterLevel;
  picks: Picks;
};

type Build = Omit<Character, "id">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function parseBuild(value: unknown): Build | undefined {
  if (!isRecord(value)) return undefined;
  const { name, cls, level, picks } = value;
  if (typeof name !== "string" || name.trim() === "") return undefined;
  if (typeof cls !== "string" || level !== 1 || !isRecord(picks)) return undefined;

  const found = classes.find({ id: cls });
  if (!found) return undefined;

  const ruleIds = new Set<string>(choices.for({ cls: found.id, level }).map((rule) => rule.id));
  const entries = Object.entries(picks);
  if (entries.some(([rule, ids]) => !ruleIds.has(rule) || !isStringList(ids))) return undefined;

  const build: Build = { name, cls: found.id, level, picks: picks as Picks };
  const unknownPick = choices.validate(build).some((issue) => issue.problem === "unknown");
  return unknownPick ? undefined : build;
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string) {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export const characters = {
  create({ name, cls }: { name: string; cls: CharacterClass }): Character {
    return { id: crypto.randomUUID(), name, cls, level: 1, picks: {} };
  },

  /** a stored character, or undefined when the value is not one */
  parse(value: unknown): Character | undefined {
    if (!isRecord(value) || typeof value.id !== "string" || value.id === "") return undefined;
    const build = parseBuild(value);
    return build && { id: value.id, ...build };
  },

  toShareCode({ cls, level, name, picks }: Character) {
    return toBase64Url(JSON.stringify({ cls, level, name, picks }));
  },

  /** the build in a share code as a new character, or undefined when the code is broken */
  fromShareCode(code: string): Character | undefined {
    try {
      const build = parseBuild(JSON.parse(fromBase64Url(code)));
      return build && { id: crypto.randomUUID(), ...build };
    } catch {
      return undefined;
    }
  },
};
