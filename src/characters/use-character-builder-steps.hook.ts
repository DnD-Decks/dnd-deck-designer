import { useState } from "react";
import type { useCharacterBuilderDraft } from "src/characters/use-character-builder-draft.hook";

export function useCharacterBuilderSteps(draft: ReturnType<typeof useCharacterBuilderDraft>) {
  const [position, setPosition] = useState(0);
  // removing the last custom card shrinks the steps — never point past the end
  const index = Math.min(position, draft.steps.length - 1);
  const step = draft.steps[index] ?? "class";
  const isLast = !!draft.cls && index === draft.steps.length - 1;
  const nextStep = draft.steps[index + 1];
  const missing = draft.missing.filter(
    (item) => item.step === step || (isLast && item.step === "name")
  );

  return {
    index,
    step,
    isLast,
    nextStep,
    missing,
    back: () => setPosition(index - 1),
    next: () => setPosition(index + 1),
  };
}
