import { choices } from "../characters/choices.model.ts";
import { isRecord, isStringList } from "../lib/json.guard.ts";
import { classes } from "../models/class/classes.model.ts";
import { progression } from "../models/class/progression.model.ts";

import type { ChoiceRuleId } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel, LandType, SubclassId } from "src/models/class/progression.model";

export type { CharacterLevel } from "src/models/class/progression.model";

/** picked ids per choice rule; `custom` holds card keys added by hand (not a ChoiceRule) */
export type Picks = Readonly<Partial<Record<ChoiceRuleId | "custom", readonly string[]>>>;

export type Character = {
  id: string;
  name: string;
  cls: CharacterClass;
  level: CharacterLevel;
  /** Circle of the Land's choice after a Long Rest; defaults to temperate. */
  land?: LandType;
  subclass?: SubclassId;
  picks: Picks;
};

type Build = Omit<Character, "id">;

const hasUnknownPick = (build: Build) =>
  choices.validate(build).some((issue) => issue.problem === "unknown");

function parseBuild(value: unknown) {
  if (!isRecord(value)) return undefined;
  const { name, cls, level, land, subclass, picks } = value;
  if (typeof name !== "string" || name.trim() === "") return undefined;
  if (typeof cls !== "string" || !progression.isLevel(level) || !isRecord(picks)) return undefined;
  if (land !== undefined && (cls !== "druid" || level !== 3 || !progression.isLand(land)))
    return undefined;
  if (
    subclass !== undefined &&
    (cls !== "fighter" || level !== 3 || !progression.isSubclass(subclass))
  )
    return undefined;

  const found = classes.find({ id: cls });
  if (!found) return undefined;

  const selected = progression.isSubclass(subclass) ? { subclass } : {};
  const ruleIds = new Set<string>(
    choices.for({ cls: found.id, level, ...selected }).map((rule) => rule.id)
  );
  const badRule = ([rule, ids]: [string, unknown]) =>
    (rule !== "custom" && !ruleIds.has(rule)) || !isStringList(ids);
  if (Object.entries(picks).some(badRule)) return undefined;

  const build: Build = {
    name,
    cls: found.id,
    level,
    picks: picks as Picks,
    ...(progression.isLand(land) ? { land } : {}),
    ...selected,
  };
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
  create({
    name,
    cls,
    level = 1,
  }: { name: string; cls: CharacterClass; level?: CharacterLevel }): Character {
    return { id: crypto.randomUUID(), name, cls, level, picks: {} };
  },

  classLine(character: Pick<Character, "level" | "cls" | "subclass">) {
    const subclass = progression.subclass(character);
    return `Level ${character.level} ${classes.get({ id: character.cls }).label}${subclass ? ` · ${subclass}` : ""}`;
  },

  parse(value: unknown) {
    if (!isRecord(value) || typeof value.id !== "string" || value.id === "") return undefined;
    const build = parseBuild(value);
    return build && { id: value.id, ...build };
  },

  toShareCode({ cls, level, name, picks, land, subclass }: Character) {
    return toBase64Url(JSON.stringify({ cls, level, name, picks, land, subclass }));
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
