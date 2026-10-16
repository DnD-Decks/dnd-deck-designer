import progressionData from "../../data/classes/class-progression.json" with { type: "json" };

import type { CharacterClass } from "src/models/class/classes.model";

export type CharacterLevel = 1 | 2 | 3;
export type LandType = "arid" | "polar" | "temperate" | "tropical";

type LevelProgression = {
  prepared?: number;
  slots?: number[];
  pactLevel?: number;
  uses?: Record<string, number>;
};

type ClassProgression = {
  subclass: string;
  levels: Record<CharacterLevel, LevelProgression>;
  alwaysPrepared?: Partial<Record<CharacterLevel, string[]>>;
  landSpells?: Record<LandType, string[]>;
};

const DATA = progressionData as Record<CharacterClass, ClassProgression>;
const LEVELS: readonly CharacterLevel[] = [1, 2, 3];
const LANDS: readonly LandType[] = ["arid", "polar", "temperate", "tropical"];

export const progression = {
  levels: LEVELS,
  lands: LANDS,

  isLevel(value: unknown): value is CharacterLevel {
    return LEVELS.some((level) => level === value);
  },

  isLand(value: unknown): value is LandType {
    return LANDS.some((land) => land === value);
  },

  get({ cls, level = 1 }: { cls: CharacterClass; level?: CharacterLevel }) {
    return DATA[cls].levels[level];
  },

  spellLevel({ cls, level }: { cls: CharacterClass; level: CharacterLevel }) {
    const current = progression.get({ cls, level });
    return current.pactLevel === 2 || (current.slots?.[1] ?? 0) > 0 ? 2 : 1;
  },

  subclass({ cls, level }: { cls: CharacterClass; level: CharacterLevel }) {
    return level === 3 ? DATA[cls].subclass : undefined;
  },

  alwaysPrepared({
    cls,
    level,
    land = "temperate",
  }: { cls: CharacterClass; level: CharacterLevel; land?: LandType }) {
    const data = DATA[cls];
    return [
      ...LEVELS.filter((unlocked) => unlocked <= level).flatMap(
        (unlocked) => data.alwaysPrepared?.[unlocked] ?? []
      ),
      ...(level === 3 ? (data.landSpells?.[land] ?? []) : []),
    ];
  },
};
