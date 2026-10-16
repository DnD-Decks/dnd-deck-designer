import { useCallback } from "react";
import type { BuilderStep } from "src/characters/use-character-builder-draft.hook";
import styles from "./character-builder.module.css";

export const STEP_LABELS: Record<BuilderStep, string> = {
  class: "Class",
  spell: "Spells",
  feat: "Maneuvers",
  weapon: "Weapons",
  custom: "Custom cards",
};

export function BuilderSteps({
  steps,
  current,
}: { steps: readonly BuilderStep[]; current: number }) {
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

export function StepHeading({ step }: { step: BuilderStep }) {
  // a new heading mounts per step; focusing it tells keyboard and screen-reader users they moved
  const focus = useCallback((heading: HTMLHeadingElement | null) => heading?.focus(), []);
  return (
    <h3 ref={focus} tabIndex={-1} className={styles.stepTitle}>
      {STEP_LABELS[step]}
    </h3>
  );
}
