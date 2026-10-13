import { choices } from "../characters/choices.model.ts";
import { isRecord, isStringList } from "../lib/json.guard.ts";
import { classes } from "../models/class/classes.model.ts";

import type { ChoiceRuleId } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";

export type CharacterLevel = 1;

/** picked ids per choice rule; `custom` holds card keys added by hand (not a ChoiceRule) */
export type Picks = Readonly<Partial<Record<ChoiceRuleId | "custom", readonly string[]>>>;

export type Character = {
  id: string;
  name: string;
  cls: CharacterClass;
  level: CharacterLevel;
  picks: Picks;
};

type Build = Omit<Character, "id">;

const hasUnknownPick = (build: Build) =>
  choices.validate(build).some((issue) => issue.problem === "unknown");

function parseBuild(value: unknown) {
  if (!isRecord(value)) return undefined;
  const { name, cls, level, picks } = value;
  if (typeof name !== "string" || name.trim() === "") return undefined;
  if (typeof cls !== "string" || level !== 1 || !isRecord(picks)) return undefined;

  const found = classes.find({ id: cls });
  if (!found) return undefined;

  const ruleIds = new Set<string>(choices.for({ cls: found.id, level }).map((rule) => rule.id));
  const badRule = ([rule, ids]: [string, unknown]) =>
    (rule !== "custom" && !ruleIds.has(rule)) || !isStringList(ids);
  if (Object.entries(picks).some(badRule)) return undefined;

  const build: Build = { name, cls: found.id, level, picks: picks as Picks };
  return hasUnknownPick(build) ? undefined : build;
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

  classLine({ level, cls }: Pick<Character, "level" | "cls">) {
    return `Level ${level} ${classes.get({ id: cls }).label}`;
  },

  parse(value: unknown) {
    if (!isRecord(value) || typeof value.id !== "string" || value.id === "") return undefined;
    const build = parseBuild(value);
    return build && { id: value.id, ...build };
  },

  toShareCode({ cls, level, name, picks }: Character) {
    return toBase64Url(JSON.stringify({ cls, level, name, picks }));
  },

  fromShareCode(code: string) {
    try {
      const json = fromBase64Url(code);
      const build = parseBuild(JSON.parse(json));
      return build && { id: crypto.randomUUID(), ...build };
    } catch {
      return undefined;
    }
  },
};
