import { useState } from "react";
import type { ChoiceSelection } from "src/characters/character-builder-choices.component";
import type { Character, Picks } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import type { ChoiceIssue } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { characterStorage } from "src/services/character.storage";
import { useLocation } from "wouter";

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

/**
 * Owns the level-one draft, validation, and persistence.
 * - Changing class clears picks; reselecting it preserves them.
 * - Editing preserves identity; failed saves retain the draft.
 * Throws on no expected input.
 */
export function useCharacterBuilderDraft(initial?: Character) {
  const [, navigate] = useLocation();
  const [cls, setClass] = useState<CharacterClass | undefined>(initial?.cls);
  const [picks, setPicks] = useState<Picks>(initial?.picks ?? {});
  const [name, setName] = useState(initial?.name ?? "");
  const [failed, setFailed] = useState(false);
  const issues = cls ? choices.validate({ cls, level: 1, picks }) : [];
  const missing = [
    ...(!cls ? ["Choose a class."] : []),
    ...issues.map(issueMessage),
    ...(!name.trim() ? ["Enter a character name."] : []),
  ];

  const chooseClass = (selected: CharacterClass) => {
    if (cls === selected) return;
    setClass(selected);
    setPicks({});
  };

  const choosePicks = ({ ruleId, ids }: ChoiceSelection) => {
    setPicks((current) => ({ ...current, [ruleId]: ids }));
  };

  const save = () => {
    if (!cls || missing.length) return;
    const trimmedName = name.trim();
    const base = initial ?? characters.create({ cls, name: trimmedName });
    const character = {
      ...base,
      cls,
      name: trimmedName,
      picks,
    };
    if (characterStorage.save(character)) navigate(`/character/${character.id}`);
    else setFailed(true);
  };

  return { cls, picks, name, failed, missing, chooseClass, choosePicks, setName, save };
}
