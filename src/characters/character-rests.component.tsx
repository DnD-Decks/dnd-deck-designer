import { useId } from "react";
import { REST_LABELS, play } from "src/characters/play.model";
import type { DeckEntry } from "src/decks/deck.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import styles from "./characters.module.css";

type RestProps = {
  rest: RestType;
  hint: string;
  disabled: boolean;
  onRest: (rest: RestType) => void;
};

function RestButton({ rest, hint, disabled, onRest }: RestProps) {
  const hintId = useId();

  return (
    <button
      type="button"
      className={styles.rest}
      disabled={disabled}
      aria-describedby={hintId}
      onClick={() => onRest(rest)}
    >
      {REST_LABELS[rest]}
      <span id={hintId} className={styles.restHint} aria-hidden="true">
        {hint}
      </span>
    </button>
  );
}

type RestsProps = {
  entries: readonly DeckEntry[];
  spent: readonly string[];
  status: string;
  onRest: (rest: RestType) => void;
};

export function Rests({ entries, spent, status, onRest }: RestsProps) {
  return (
    <>
      <div className={styles.rests}>
        {(["short-rest", "long-rest"] as const).map((rest) => (
          <RestButton
            key={rest}
            rest={rest}
            hint={play.restHint({ entries, rest })}
            disabled={play.recovered({ entries, spent, rest }).length === 0}
            onRest={onRest}
          />
        ))}
      </div>
      <output className={styles.restStatus}>{status}</output>
    </>
  );
}
