import { useCallback } from "react";
import styles from "./character-builder.module.css";

const STEPS = [
  { label: "Class", index: 0 },
  { label: "Choices", index: 1 },
  { label: "Name", index: 2 },
];

type BuilderProgressProps = { step: number };

/**
 * Shows progress and focuses the active step heading.
 * - A step change mounts a new heading; draft edits leave focus alone.
 * Throws on no expected input.
 */
export function BuilderProgress({ step }: BuilderProgressProps) {
  const focusStep = useCallback((heading: HTMLHeadingElement | null) => {
    heading?.focus();
  }, []);

  return (
    <>
      <ol className={styles.steps} aria-label="Character builder steps">
        {STEPS.map(({ label, index }) => (
          <li key={label} aria-current={step === index ? "step" : undefined}>
            {index + 1} {label}
          </li>
        ))}
      </ol>
      <h3 key={step} ref={focusStep} tabIndex={-1}>
        {STEPS[step]?.label}
      </h3>
    </>
  );
}
