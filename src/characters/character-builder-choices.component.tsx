import { useId } from "react";
import { DeckCardFace } from "src/cards/deck-card.component";
import { useCardSpotlight } from "src/cards/use-card-spotlight.hook";
import type { Picks } from "src/characters/character.model";
import type { ChoiceRule, ChoiceSelection, ChoiceSource } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import type { DeckEntry } from "src/decks/deck.model";
import { cardName } from "src/decks/deck.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import styles from "./character-builder.module.css";

type BuilderChoicesProps = {
  cls: CharacterClass;
  kind: ChoiceSource["kind"];
  picks: Picks;
  onChange: (selection: ChoiceSelection) => void;
};

type ChoiceGroupProps = {
  cls: CharacterClass;
  rule: ChoiceRule;
  picked: readonly string[];
  onChange: (ids: readonly string[]) => void;
};

function choiceEntry({ id, kind }: { id: string; kind: ChoiceRule["from"]["kind"] }): DeckEntry {
  const weapon = kind === "weapon" ? weapons.find({ id }) : undefined;
  if (weapon) return { key: id, card: { kind: "weapon", weapon } };
  return { key: id, card: { kind: "spell", spell: spells.get({ id }) } };
}

type ChoiceSlotProps = Omit<ChoiceGroupProps, "cls"> & {
  id: string;
  trigger: (element: HTMLElement | null) => () => void;
  onZoom: () => void;
};

function ChoiceSlot({ id, rule, picked, trigger, onChange, onZoom }: ChoiceSlotProps) {
  const entry = choiceEntry({ id, kind: rule.from.kind });
  const name = cardName(entry.card);
  const checked = picked.includes(id);
  const disabled = !checked && picked.length >= rule.pick;

  const toggle = () => onChange(checked ? picked.filter((pick) => pick !== id) : [...picked, id]);

  return (
    <div className={styles.slot}>
      <DeckCardFace card={entry.card} />
      <input
        type="checkbox"
        className={styles.pick}
        aria-label={name}
        checked={checked}
        disabled={disabled}
        onChange={toggle}
      />
      <button
        type="button"
        className={styles.zoom}
        aria-label={`Zoom ${name}`}
        ref={trigger}
        onClick={onZoom}
      />
    </div>
  );
}

function ChoiceGroup({ cls, rule, picked, onChange }: ChoiceGroupProps) {
  const hintId = useId();
  const options = choices.options({ cls, rule });
  const hint = rule.optional ? `Optional — choose up to ${rule.pick}.` : `Choose ${rule.pick}.`;
  const entries = options.map((id) => choiceEntry({ id, kind: rule.from.kind }));
  const { hold, trigger, spotlight } = useCardSpotlight({ entries });

  return (
    <fieldset className={styles.group} aria-describedby={hintId}>
      <legend className={styles.legend}>{rule.label}</legend>
      <output className={styles.tally} aria-live="polite">
        {picked.length} of {rule.pick} chosen
      </output>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
      <div className={styles.hand}>
        {options.map((id) => (
          <ChoiceSlot
            key={id}
            id={id}
            rule={rule}
            picked={picked}
            trigger={trigger(id)}
            onChange={onChange}
            onZoom={() => hold(id)}
          />
        ))}
      </div>
      {spotlight}
    </fieldset>
  );
}

export function BuilderChoices({ cls, kind, picks, onChange }: BuilderChoicesProps) {
  const rules = choices.for({ cls, level: 1 }).filter((rule) => rule.from.kind === kind);
  return rules.map((rule) => (
    <ChoiceGroup
      key={`${cls}-${rule.id}`}
      cls={cls}
      rule={rule}
      picked={picks[rule.id] ?? []}
      onChange={(ids) => onChange({ ruleId: rule.id, ids })}
    />
  ));
}
