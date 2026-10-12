import { useState } from "react";
import type { Character, Picks } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import type { ChoiceIssue, ChoiceSelection, ChoiceSource } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import { decks } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { useLocation } from "wouter";

export type BuilderStep = "class" | ChoiceSource["kind"] | "custom";

export type Missing = { step: BuilderStep | "name"; message: string };

const CHOICE_STEPS: ChoiceSource["kind"][] = ["spell", "weapon"];

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
function withKnownCustom(picks: Picks): Picks {
  if (!picks.custom?.length) return picks;
  const known = picks.custom.filter((key) => decks.findCard({ key }));
  if (known.length) return { ...picks, custom: known };
  const { custom: _dropped, ...rest } = picks;
  return rest;
}

// a fighter has no spells to choose: its steps are ["class", "weapon"]
function stepsFor(cls: CharacterClass | undefined, picks: Picks): BuilderStep[] {
  const kinds = new Set(cls ? choices.for({ cls, level: 1 }).map((rule) => rule.from.kind) : []);
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
  const [picks, setPicks] = useState<Picks>(() => withKnownCustom(initial?.picks ?? {}));
  const [name, setName] = useState(initial?.name ?? "");
  const [failed, setFailed] = useState(false);
  const steps = stepsFor(cls, picks);
  const issues = cls ? choices.validate({ cls, level: 1, picks }) : [];
  const missing: Missing[] = [
    ...(!cls ? [{ step: "class" as const, message: "Choose a class." }] : []),
    ...issues.map((issue) => ({ step: issue.rule.from.kind, message: issueMessage(issue) })),
    ...(!name.trim() ? [{ step: "name" as const, message: "Enter a character name." }] : []),
  ];

  const chooseClass = (selected: CharacterClass) => {
    if (cls === selected) return;
    setClass(selected);
    setPicks({});
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
    const character = { ...base, cls, name: trimmedName, picks };
    if (characterStorage.save(character)) navigate(`/character/${character.id}`);
    else setFailed(true);
  };

  return {
    cls,
    picks,
    name,
    failed,
    steps,
    missing,
    chooseClass,
    choosePicks,
    chooseCustom,
    setName,
    save,
  };
}
