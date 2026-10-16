import classChoicesData from "../data/choices/class-choices.json" with { type: "json" };
import { assertNever } from "../lib/assert-never.ts";
import { progression } from "../models/class/progression.model.ts";
import { feats } from "../models/feats/feats.model.ts";
import { weapons } from "../models/gear/weapons.model.ts";
import { spells } from "../models/spells/spells.model.ts";

import type { Character, CharacterLevel } from "src/characters/character.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { SubclassId } from "src/models/class/progression.model";
import type { SpellLevel } from "src/models/spells/spells.model";

export type ChoiceSource =
  | { kind: "spell"; level: SpellLevel; levels?: SpellLevel[] }
  | { kind: "feat"; level: CharacterLevel; subclass: SubclassId; choice: "maneuvers" }
  | { kind: "weapon" };

export type ChoiceRuleId = "cantrips" | "prepared" | "weapons" | "maneuvers";

export type ChoiceRule = {
  id: ChoiceRuleId;
  label: string;
  pick: number;
  /** up to `pick`, none required (weapons for classes without Weapon Mastery) */
  optional?: boolean;
  excluded?: readonly string[];
  from: ChoiceSource;
};

export type ChoiceSelection = { ruleId: ChoiceRule["id"]; ids: readonly string[] };

export type ChoiceIssue =
  | { rule: ChoiceRule; problem: "missing"; count: number }
  | { rule: ChoiceRule; problem: "too-many"; count: number }
  | { rule: ChoiceRule; problem: "unknown"; ids: string[] };

type Build = Pick<Character, "cls" | "level" | "picks" | "land" | "subclass">;

type LevelRules = Partial<Record<CharacterLevel, ChoiceRule[]>>;
type ClassChoices = Record<CharacterClass, LevelRules>;

const DATA = classChoicesData as ClassChoices;

export const choices = {
  for({ cls, level, land, subclass }: Omit<Build, "picks">): readonly ChoiceRule[] {
    const prepared = progression.get({ cls, level }).prepared;
    const automatic = progression.alwaysPrepared({ cls, level, land });
    const rules: ChoiceRule[] = (DATA[cls][1] ?? []).map((rule) => {
      const excluded =
        rule.from.kind === "spell"
          ? automatic.filter((id) =>
              rule.id === "cantrips" ? spells.get({ id }).level === 0 : spells.get({ id }).level > 0
            )
          : undefined;
      return rule.id === "prepared"
        ? {
            ...rule,
            pick: prepared ?? rule.pick,
            excluded,
            from: {
              kind: "spell",
              level: 1,
              levels: progression.spellLevel({ cls, level }) === 2 ? [1, 2] : [1],
            },
          }
        : { ...rule, ...(rule.from.kind === "spell" ? { excluded } : {}) };
    });
    if (cls === "fighter" && level === 3 && subclass === "battle-master")
      rules.push({
        id: "maneuvers",
        label: "Maneuvers",
        pick: 3,
        from: { kind: "feat", level: 3, subclass: "battle-master", choice: "maneuvers" },
      });
    return rules;
  },

  options({ cls, rule }: { cls: CharacterClass; rule: ChoiceRule }) {
    switch (rule.from.kind) {
      case "feat": {
        const source = rule.from;
        return feats
          .findAll({ cls, level: source.level, subclass: source.subclass })
          .filter((feat) => feat.choice === source.choice)
          .map((feat) => feat.id);
      }
      case "spell":
        return (rule.from.levels ?? [rule.from.level])
          .flatMap((level) => spells.findAll({ cls, level }))
          .map((s) => s.id)
          .filter((id) => !rule.excluded?.includes(id));
      case "weapon":
        return weapons.findAll({ cls }).map((w) => w.id);
      default:
        return assertNever(rule.from);
    }
  },

  /** everything that keeps a build from being complete; empty means ready to play */
  validate({ cls, level, picks, land, subclass }: Build): ChoiceIssue[] {
    return choices.for({ cls, level, land, subclass }).flatMap((rule): ChoiceIssue[] => {
      const picked = picks[rule.id] ?? [];
      const options = new Set(choices.options({ cls, rule }));
      // Older builds may have counted an always-prepared spell among their picks.
      const unknown = picked.filter((id) => !options.has(id) && !rule.excluded?.includes(id));
      const count = new Set(picked.filter((id) => !rule.excluded?.includes(id))).size;

      if (unknown.length > 0) return [{ rule, problem: "unknown", ids: unknown }];
      if (count > rule.pick) return [{ rule, problem: "too-many", count: count - rule.pick }];
      if (count < rule.pick && !rule.optional)
        return [{ rule, problem: "missing", count: rule.pick - count }];
      return [];
    });
  },

  /** Keep valid choices when changing level or daily land spells. */
  reconcile({ cls, level, picks, land, subclass }: Build) {
    const selected = Object.fromEntries(
      choices.for({ cls, level, land, subclass }).flatMap((rule) => {
        if (!picks[rule.id]) return [];
        const available = new Set(choices.options({ cls, rule }));
        return [
          [
            rule.id,
            [...new Set(picks[rule.id])].filter((id) => available.has(id)).slice(0, rule.pick),
          ],
        ];
      })
    );
    return { ...selected, ...(picks.custom ? { custom: picks.custom } : {}) };
  },

  /** picked ids by card kind, across every rule of the build */
  picked({ cls, level, picks, land, subclass }: Build) {
    const byKind = {
      spell: new Set(progression.alwaysPrepared({ cls, level, land })),
      weapon: new Set<string>(),
      feat: new Set<string>(),
    };
    for (const rule of choices.for({ cls, level, land, subclass })) {
      for (const id of picks[rule.id] ?? []) byKind[rule.from.kind].add(id);
    }
    return byKind;
  },
};
