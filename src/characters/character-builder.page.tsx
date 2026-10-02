import { type FormEvent, useCallback, useId, useState } from "react";
import { BuilderChoices } from "src/characters/character-builder-choices.component";
import type { BuilderStep, Missing } from "src/characters/character-builder-draft.hook";
import { useCharacterBuilderDraft } from "src/characters/character-builder-draft.hook";
import type { Character } from "src/characters/character.model";
import { ClassSelector } from "src/decks/class-selector.component";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./character-builder.module.css";

const STEP_LABELS: Record<BuilderStep, string> = {
  class: "Class",
  spell: "Spells",
  weapon: "Weapons",
};

function BuilderSteps({ steps, current }: { steps: readonly BuilderStep[]; current: number }) {
  return (
    <ol className={styles.steps} aria-label="Character builder steps">
      {steps.map((step, index) => (
        <li key={step} aria-current={index === current ? "step" : undefined}>
          <span className={styles.stepNumber}>{index + 1}</span> {STEP_LABELS[step]}
        </li>
      ))}
    </ol>
  );
}

function StepHeading({ step }: { step: BuilderStep }) {
  // a new heading mounts per step; focusing it tells keyboard and screen-reader users they moved
  const focus = useCallback((heading: HTMLHeadingElement | null) => heading?.focus(), []);
  return (
    <h3 ref={focus} tabIndex={-1} className={styles.stepTitle}>
      {STEP_LABELS[step]}
    </h3>
  );
}

type BuildTrayProps = {
  missing: readonly Missing[];
  isLast: boolean;
  canGoBack: boolean;
  nextLabel?: string;
  name: string;
  failed: boolean;
  onName: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
  onBuild: () => void;
};

function BuildTray({
  missing,
  isLast,
  canGoBack,
  nextLabel,
  name,
  failed,
  onName,
  onBack,
  onNext,
  onBuild,
}: BuildTrayProps) {
  const statusId = useId();
  const nameId = useId();
  const blocked = missing.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isLast) onBuild();
    else if (!blocked) onNext();
  };

  return (
    <form className={styles.tray} aria-label="Builder actions" onSubmit={submit}>
      <p id={statusId} className={styles.status} data-ready={!blocked || undefined}>
        {blocked && missing[0]?.message}
        {!blocked && isLast && "Every card is chosen."}
        {!blocked && !isLast && `Done. Next up: ${nextLabel}.`}
      </p>
      {failed && (
        <p role="alert" className={styles.status}>
          Couldn't save to this device. Check browser storage and try again.
        </p>
      )}
      {isLast && (
        <label htmlFor={nameId} className={styles.nameLabel}>
          Character name
        </label>
      )}
      <div className={styles.buildRow}>
        {canGoBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            Back
          </button>
        )}
        {isLast && (
          <input
            id={nameId}
            className={styles.name}
            value={name}
            required
            autoComplete="off"
            onChange={(event) => onName(event.target.value)}
          />
        )}
        <button
          type="submit"
          className={styles.build}
          disabled={blocked}
          aria-describedby={statusId}
        >
          {isLast ? "Build deck" : "Next"}
        </button>
      </div>
    </form>
  );
}

function Builder({ initial }: { initial?: Character }) {
  const draft = useCharacterBuilderDraft(initial);
  const [index, setIndex] = useState(0);
  const step = draft.steps[index] ?? "class";
  const isLast = !!draft.cls && index === draft.steps.length - 1;
  const nextStep = draft.steps[index + 1];
  const missing = draft.missing.filter(
    (item) => item.step === step || (isLast && item.step === "name")
  );

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
      {step === "class" && <ClassSelector selected={draft.cls} onSelect={draft.chooseClass} />}
      {step !== "class" && draft.cls && (
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
        onBack={() => setIndex(index - 1)}
        onNext={() => setIndex(index + 1)}
        onBuild={draft.save}
      />
    </main>
  );
}

export function CharacterBuilderPage({ id }: { id?: string }) {
  const initial = id ? characterStorage.get(id) : undefined;
  if (id && !initial) {
    return (
      <main className={styles.page}>
        <h2 className={styles.title}>Character not found</h2>
        <p className={styles.hint}>This device has no character with that link.</p>
        <Link href="/" className={styles.cancel}>
          Back to your characters
        </Link>
      </main>
    );
  }
  return <Builder key={id ?? "new"} initial={initial} />;
}
