import { useState } from "react";
import { BuilderChoices } from "src/characters/character-builder-choices.component";
import { useCharacterBuilderDraft } from "src/characters/character-builder-draft.hook";
import { BuilderFooter } from "src/characters/character-builder-footer.component";
import type { BuilderPreviewSelection } from "src/characters/character-builder-preview.component";
import { BuilderPreview } from "src/characters/character-builder-preview.component";
import { BuilderProgress } from "src/characters/character-builder-progress.component";
import { BuilderClass, BuilderName } from "src/characters/character-builder-steps.component";
import type { Character } from "src/characters/character.model";
import { characterStorage } from "src/services/character.storage";
import { Link } from "wouter";
import styles from "./character-builder.module.css";

type BuilderProps = { initial?: Character };

function Builder({ initial }: BuilderProps) {
  const draft = useCharacterBuilderDraft(initial);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<BuilderPreviewSelection | null>(null);

  return (
    <>
      <main
        className={styles.page}
        aria-hidden={preview ? true : undefined}
        inert={preview ? true : undefined}
      >
        <h2>{initial ? "Edit character" : "New character"}</h2>
        <BuilderProgress step={step} />
        {step === 0 && <BuilderClass cls={draft.cls} onChange={draft.chooseClass} />}
        {step === 1 && draft.cls && (
          <BuilderChoices
            cls={draft.cls}
            picks={draft.picks}
            onChange={draft.choosePicks}
            onPreview={setPreview}
          />
        )}
        {step === 2 && <BuilderName name={draft.name} onChange={draft.setName} />}
        <BuilderFooter
          step={step}
          hasClass={!!draft.cls}
          missing={draft.missing}
          failed={draft.failed}
          cancelHref={initial ? `/character/${initial.id}` : "/"}
          onStepChange={setStep}
          onSave={draft.save}
        />
      </main>
      {preview && <BuilderPreview preview={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

type CharacterBuilderPageProps = { id?: string };

/**
 * Builds or edits a level-one character stored on this device.
 * - No id starts a new draft; a saved id loads its character.
 * - An unknown id shows a not-found page.
 * Throws on no expected input.
 */
export function CharacterBuilderPage({ id }: CharacterBuilderPageProps) {
  const initial = id ? characterStorage.get(id) : undefined;
  if (id && !initial) {
    return (
      <main className={styles.page}>
        <h2>Character not found</h2>
        <p>This device has no character with that link.</p>
        <Link href="/">Back to your characters</Link>
      </main>
    );
  }
  return <Builder key={id ?? "new"} initial={initial} />;
}
