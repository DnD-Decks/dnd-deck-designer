import classChoicesData from "../data/choices/class-choices.json" with { type: "json" };
import { weapons } from "../models/gear/weapons.model.ts";
import { spells } from "../models/spells/spells.model.ts";

import type { Character, CharacterLevel } from "src/characters/character.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { SpellLevel } from "src/models/spells/spells.model";

export type ChoiceSource = { kind: "spell"; level: SpellLevel } | { kind: "weapon" };

export type ChoiceRule = {
  id: string;
  label: string;
  pick: number;
  /** up to `pick`, none required (weapons for classes without Weapon Mastery) */
  optional?: boolean;
  from: ChoiceSource;
};

export type ChoiceIssue =
  | { rule: ChoiceRule; problem: "missing"; count: number }
  | { rule: ChoiceRule; problem: "too-many"; count: number }
  | { rule: ChoiceRule; problem: "unknown"; ids: string[] };

type Build = Pick<Character, "cls" | "level" | "picks">;

const DATA = classChoicesData as Record<CharacterClass, Record<string, ChoiceRule[]>>;

export const choices = {
  for({ cls, level }: { cls: CharacterClass; level: CharacterLevel }): readonly ChoiceRule[] {
    return DATA[cls][level] ?? [];
  },

  options({ cls, rule }: { cls: CharacterClass; rule: ChoiceRule }): readonly string[] {
    return rule.from.kind === "spell"
      ? spells.findAll({ cls, level: rule.from.level }).map((s) => s.id)
      : weapons.findAll({ cls }).map((w) => w.id);
  },

  /** everything that keeps a build from being complete; empty means ready to play */
  validate({ cls, level, picks }: Build): ChoiceIssue[] {
    return choices.for({ cls, level }).flatMap((rule): ChoiceIssue[] => {
      const picked = picks[rule.id] ?? [];
      const options = new Set(choices.options({ cls, rule }));
      const unknown = picked.filter((id) => !options.has(id));
      const count = new Set(picked).size;

      if (unknown.length > 0) return [{ rule, problem: "unknown", ids: unknown }];
      if (count > rule.pick) return [{ rule, problem: "too-many", count: count - rule.pick }];
      if (count < rule.pick && !rule.optional)
        return [{ rule, problem: "missing", count: rule.pick - count }];
      return [];
    });
  },

  /** picked ids by card kind, across every rule of the build */
  picked({ cls, level, picks }: Build) {
    const byKind = { spell: new Set<string>(), weapon: new Set<string>() };
    for (const rule of choices.for({ cls, level })) {
      for (const id of picks[rule.id] ?? []) byKind[rule.from.kind].add(id);
    }
    return byKind;
  },
};
