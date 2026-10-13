import { type FormEvent, useId } from "react";
import type { Missing } from "src/characters/use-character-builder-draft.hook";
import styles from "./character-builder.module.css";

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

export function BuildTray({
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
