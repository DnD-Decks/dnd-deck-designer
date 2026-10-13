import { useState } from "react";
import { BuilderChoices } from "src/characters/character-builder-choices.component";
import {
  BuilderSteps,
  STEP_LABELS,
  StepHeading,
} from "src/characters/character-builder-steps.component";
import { BuildTray } from "src/characters/character-builder-tray.component";
import { CharacterNotFound } from "src/characters/character-dead-end.component";
import type { Character } from "src/characters/character.model";
import { CustomCards } from "src/characters/custom-cards.component";
import { useCharacterBuilderDraft } from "src/characters/use-character-builder-draft.hook";
import { useCharacterBuilderSteps } from "src/characters/use-character-builder-steps.hook";
import { ClassSelector } from "src/decks/class-selector.component";
import { cardName, decks } from "src/decks/deck.model";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./character-builder.module.css";

function Builder({ initial }: { initial?: Character }) {
  const draft = useCharacterBuilderDraft(initial);
  const { index, step, isLast, nextStep, missing, back, next } = useCharacterBuilderSteps(draft);
  const [removed, setRemoved] = useState<string>();
  const custom = draft.picks.custom ?? [];

  const removeCustom = (key: string) => {
    const card = decks.findCard({ key });
    if (card) setRemoved(cardName(card));
    draft.chooseCustom(custom.filter((k) => k !== key));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>{initial ? "Edit character" : "New character"}</h2>
        <Link href={initial ? `/character/${initial.id}` : "/"} className={styles.cancel}>
          Cancel
        </Link>
      </header>
      <BuilderSteps steps={draft.steps} current={index} />
      <StepHeading key={step} step={step} />
      {/* outside CustomCards: it unmounts with the step, this must outlive it */}
      <output aria-live="polite" className={styles.visuallyHidden}>
        {removed && `${removed} removed`}
      </output>
      {step === "class" && <ClassSelector selected={draft.cls} onSelect={draft.chooseClass} />}
      {step === "custom" && <CustomCards keys={custom} onRemove={removeCustom} />}
      {step !== "class" && step !== "custom" && draft.cls && (
        <BuilderChoices
          cls={draft.cls}
          kind={step}
          picks={draft.picks}
          onChange={draft.choosePicks}
        />
      )}
      <BuildTray
        missing={missing}
        isLast={isLast}
        canGoBack={index > 0}
        nextLabel={nextStep && STEP_LABELS[nextStep]}
        name={draft.name}
        failed={draft.failed}
        onName={draft.setName}
        onBack={back}
        onNext={next}
        onBuild={draft.save}
      />
    </main>
  );
}

export function CharacterBuilderPage({ id }: { id?: string }) {
  const initial = id ? characterStorage.get(id) : undefined;
  if (id && !initial) return <CharacterNotFound />;
  return <Builder key={id ?? "new"} initial={initial} />;
}
