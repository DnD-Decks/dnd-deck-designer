import { useId } from "react";
import { Link } from "wouter";
import styles from "./character-builder.module.css";

type BuilderFooterProps = {
  step: number;
  hasClass: boolean;
  missing: readonly string[];
  failed: boolean;
  cancelHref: string;
  onStepChange: (step: number) => void;
  onSave: () => void;
};

/**
 * Shows draft validation and builder navigation.
 * - Class gates Next; complete choices and a name gate Save.
 * - Storage failures leave navigation and retry available.
 * Throws on no expected input.
 */
export function BuilderFooter({
  step,
  hasClass,
  missing,
  failed,
  cancelHref,
  onStepChange,
  onSave,
}: BuilderFooterProps) {
  const missingId = useId();
  return (
    <>
      <div id={missingId} className={styles.missing}>
        {missing.length > 0 && (
          <>
            <p>Before saving:</p>
            <ul>
              {missing.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </>
        )}
        {missing.length === 0 && <p>Ready to save.</p>}
      </div>
      {failed && (
        <p role="alert">
          Couldn't save to this device. Check browser storage and try again. Your draft is still
          here.
        </p>
      )}
      <nav className={styles.actions} aria-label="Builder actions">
        <Link href={cancelHref}>Cancel</Link>
        {step > 0 && (
          <button type="button" onClick={() => onStepChange(step - 1)}>
            Back
          </button>
        )}
        {step < 2 && (
          <button type="button" disabled={!hasClass} onClick={() => onStepChange(step + 1)}>
            Next
          </button>
        )}
        {step >= 2 && (
          <button
            type="button"
            disabled={missing.length > 0}
            aria-describedby={missingId}
            onClick={onSave}
          >
            Save character
          </button>
        )}
      </nav>
    </>
  );
}
