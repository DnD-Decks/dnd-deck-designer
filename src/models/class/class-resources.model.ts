import classResourcesData from "src/data/class/class-resources.json";

import type { CharacterClass } from "src/models/class/classes.model";

export type ResetOn = "short-rest" | "long-rest";

export type ResourceDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type ResolvedResource = ResourceDefinition & {
  resetOn: ResetOn;
  max: number;
};

type ProgressionValue = number | string;

type ClassResourceEntry = ResourceDefinition & {
  resetOn: ResetOn;
  progression: Record<string, ProgressionValue>;
};

type ClassEntry = { resources: ClassResourceEntry[] };

const CLASS_RESOURCES = classResourcesData as Record<CharacterClass, ClassEntry>;

const ALL: ResourceDefinition[] = [];
const BY_ID = new Map<string, ClassResourceEntry>();

for (const classEntry of Object.values(CLASS_RESOURCES)) {
  for (const r of classEntry.resources) {
    if (!BY_ID.has(r.id)) {
      BY_ID.set(r.id, r);
      ALL.push({ id: r.id, name: r.name, description: r.description, icon: r.icon });
    }
  }
}

function resolveMax(value: ProgressionValue): number {
  if (typeof value === "number") return value;
  throw new Error(`Ability-mod progression not supported yet: ${value}`);
}

export const classResources = {
  get({ id }: { id: string }): ResourceDefinition {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`Unknown resource: ${id}`);
    return { id: found.id, name: found.name, description: found.description, icon: found.icon };
  },

  find({ id }: { id: string }): ResourceDefinition | undefined {
    const found = BY_ID.get(id);
    if (!found) return undefined;
    return { id: found.id, name: found.name, description: found.description, icon: found.icon };
  },

  list(): ResourceDefinition[] {
    return ALL;
  },

  findAll({ cls, level }: { cls: CharacterClass; level: number }): ResolvedResource[] {
    const classEntry = CLASS_RESOURCES[cls];
    if (!classEntry) return [];

    const results: ResolvedResource[] = [];
    for (const r of classEntry.resources) {
      const raw = r.progression[String(level)];
      if (raw === undefined) continue;
      const max = resolveMax(raw);
      if (max <= 0) continue;
      results.push({
        id: r.id,
        name: r.name,
        description: r.description,
        icon: r.icon,
        resetOn: r.resetOn,
        max,
      });
    }
    return results;
  },
};
