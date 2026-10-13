import classResourcesData from "../../data/classes/class-resources.json" with { type: "json" };

// Runtime import: relative .ts path so node:test can resolve without the src/* alias.
import { lookup } from "../../lib/lookup.ts";
import { computeModifier } from "../abilities/abilities.model.ts";

import type { AbilityName, AbilityScores } from "src/models/abilities/abilities.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { RestType } from "src/models/rest/rest-actions.model";

export type ResourceId = string;

export type AbilityModKey = "str-mod" | "dex-mod" | "con-mod" | "int-mod" | "wis-mod" | "cha-mod";

export type ProgressionValue = number | AbilityModKey;

export type ResourceDefinition = {
  id: ResourceId;
  name: string;
  description: string;
};

export type CharacterResource = {
  resourceId: ResourceId;
  current: number;
  max: number;
};

type RawResourceEntry = {
  id: ResourceId;
  name: string;
  description: string;
  resetOn: RestType;
  progression: Record<string, ProgressionValue>;
};

type RawClassEntry = { resources: RawResourceEntry[] };

const RAW = classResourcesData as Record<CharacterClass, RawClassEntry>;

function classEntries([className, classEntry]: [string, RawClassEntry]) {
  if (!Array.isArray(classEntry.resources)) {
    throw new Error(`class-resources.json: missing "resources" array for class "${className}"`);
  }
  for (const r of classEntry.resources) {
    if (!r.id)
      throw new Error(`class-resources.json: resource entry missing "id" in class "${className}"`);
  }
  return classEntry.resources;
}

// Deduplicate resource definitions across classes (e.g. spell-slot-1st appears in many classes).
const DEFS_BY_ID = new Map<ResourceId, ResourceDefinition>();
for (const r of Object.entries(RAW).flatMap(classEntries)) {
  if (!DEFS_BY_ID.has(r.id))
    DEFS_BY_ID.set(r.id, { id: r.id, name: r.name, description: r.description });
}
const TABLE = lookup({ items: [...DEFS_BY_ID.values()], key: "id", label: "resource" });

const ABILITY_MOD_MAP: Record<AbilityModKey, AbilityName> = {
  "str-mod": "str",
  "dex-mod": "dex",
  "con-mod": "con",
  "int-mod": "int",
  "wis-mod": "wis",
  "cha-mod": "cha",
};

function resolveMax({ value, scores }: { value: ProgressionValue; scores: AbilityScores }) {
  if (typeof value === "number") return value;
  return Math.max(1, computeModifier(scores[ABILITY_MOD_MAP[value]]));
}

type ForLevel = { cls: CharacterClass; level: number; scores: AbilityScores };

export function resolveResourcesForLevel({ cls, level, scores }: ForLevel) {
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    throw new Error(`resolveResourcesForLevel: level must be an integer 1–5, got ${level}`);
  }
  const entry = RAW[cls];
  if (!entry) throw new Error(`resolveResourcesForLevel: no data for class "${cls}"`);
  return entry.resources.flatMap((r) => {
    const max = resolveMax({ value: r.progression[String(level)] ?? 0, scores });
    return max > 0 ? [{ resourceId: r.id, current: max, max }] : [];
  });
}

export function resolveResourceResetOn({ cls, id }: { cls: CharacterClass; id: ResourceId }) {
  const entry = RAW[cls];
  if (!entry) throw new Error(`resolveResourceResetOn: unknown class "${cls}"`);
  const resource = entry.resources.find((r) => r.id === id);
  if (!resource) throw new Error(`Unknown resource "${id}" for class "${cls}"`);
  return resource.resetOn;
}

export const classResources = {
  get: ({ id }: { id: ResourceId }) => TABLE.get(id),
  find: ({ id }: { id: ResourceId }) => TABLE.find(id),
  list: TABLE.list,
};
