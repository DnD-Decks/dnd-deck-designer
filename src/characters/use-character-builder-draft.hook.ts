import { useState } from "react";
import type { Character, Picks } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import type { ChoiceIssue, ChoiceSelection, ChoiceSource } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import { decks } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel, LandType, SubclassId } from "src/models/class/progression.model";
import { characterStorage } from "src/services/character.storage";
import { useLocation } from "wouter";

export type BuilderStep = "class" | ChoiceSource["kind"] | "custom";

export type Missing = { step: BuilderStep | "name"; message: string };

const CHOICE_STEPS: ChoiceSource["kind"][] = ["spell", "feat", "weapon"];

function issueMessage(issue: ChoiceIssue) {
  switch (issue.problem) {
    case "missing":
      return `${issue.rule.label}: choose ${issue.count} more.`;
    case "too-many":
      return `${issue.rule.label}: remove ${issue.count} choices.`;
    case "unknown":
      return `${issue.rule.label}: remove unavailable choices.`;
  }
}

// a stored custom key may name a card the data no longer ships — keep only real ones
function withKnownCustom(picks: Picks) {
  if (!picks.custom?.length) return picks;
  const known = picks.custom.filter((key) => decks.findCard({ key }));
  if (known.length) return { ...picks, custom: known };
  const { custom: _dropped, ...rest } = picks;
  return rest;
}

// a fighter has no spells to choose: its steps are ["class", "weapon"]
function stepsFor({
  cls,
  picks,
  level,
  subclass,
}: {
  cls: CharacterClass | undefined;
  picks: Picks;
  level: CharacterLevel;
  subclass: SubclassId;
}): BuilderStep[] {
  const kinds = new Set(
    cls ? choices.for({ cls, level, subclass }).map((rule) => rule.from.kind) : []
  );
  return [
    "class",
    ...CHOICE_STEPS.filter((kind) => kinds.has(kind)),
    // the custom cards from the catalog get a step of their own, only while some exist
    ...(picks.custom?.length ? (["custom"] as const) : []),
  ];
}

export function useCharacterBuilderDraft(initial?: Character) {
  const [, navigate] = useLocation();
  const [cls, setClass] = useState<CharacterClass | undefined>(initial?.cls);
  const [level, setLevel] = useState<CharacterLevel>(initial?.level ?? 1);
  const [land, setLand] = useState<LandType>(initial?.land ?? "temperate");
  const [subclass, setSubclass] = useState<SubclassId>(initial?.subclass ?? "champion");
  const [picks, setPicks] = useState<Picks>(() =>
    withKnownCustom(initial ? choices.reconcile(initial) : {})
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [failed, setFailed] = useState(false);
  const steps = stepsFor({ cls, picks, level, subclass });
  const issues = cls ? choices.validate({ cls, level, land, subclass, picks }) : [];
  const missing: Missing[] = [
    ...(!cls ? [{ step: "class" as const, message: "Choose a class." }] : []),
    ...issues.map((issue) => ({ step: issue.rule.from.kind, message: issueMessage(issue) })),
    ...(!name.trim() ? [{ step: "name" as const, message: "Enter a character name." }] : []),
  ];

  const chooseClass = (selected: CharacterClass) => {
    if (cls === selected) return;
    setClass(selected);
    setLand("temperate");
    setSubclass("champion");
    setPicks({});
  };

  const chooseLevel = (selected: CharacterLevel) => {
    setLevel(selected);
    if (cls)
      setPicks((current) =>
        choices.reconcile({ cls, level: selected, land, subclass, picks: current })
      );
  };

  const chooseLand = (selected: LandType) => {
    setLand(selected);
    if (cls)
      setPicks((current) =>
        choices.reconcile({ cls, level, land: selected, subclass, picks: current })
      );
  };

  const chooseSubclass = (selected: SubclassId) => {
    setSubclass(selected);
    if (cls)
      setPicks((current) =>
        choices.reconcile({ cls, level, land, subclass: selected, picks: current })
      );
  };

  const choosePicks = ({ ruleId, ids }: ChoiceSelection) => {
    setPicks((current) => ({ ...current, [ruleId]: ids }));
  };

  const chooseCustom = (ids: readonly string[]) => {
    setPicks((current) => ({ ...current, custom: ids }));
  };

  const save = () => {
    if (!cls || missing.length) return;
    const trimmedName = name.trim();
    const base = initial ?? characters.create({ cls, name: trimmedName });
    const { land: _, subclass: _subclass, ...identity } = base;
    const character = {
      ...identity,
      cls,
      level,
      name: trimmedName,
      picks,
      ...(cls === "druid" && level === 3 ? { land } : {}),
      ...(cls === "fighter" && level === 3 ? { subclass } : {}),
    };
    if (characterStorage.save(character)) navigate(`/character/${character.id}`);
    else setFailed(true);
  };

  return {
    cls,
    level,
    land,
    subclass,
    picks,
    name,
    failed,
    steps,
    missing,
    chooseClass,
    chooseLevel,
    chooseLand,
    chooseSubclass,
    choosePicks,
    chooseCustom,
    setName,
    save,
  };
}
