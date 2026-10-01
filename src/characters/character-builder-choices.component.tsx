import { useId } from "react";
import type { BuilderPreviewSelection } from "src/characters/character-builder-preview.component";
import type { Picks } from "src/characters/character.model";
import type { ChoiceRule } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import styles from "./character-builder.module.css";

export type ChoiceSelection = { ruleId: ChoiceRule["id"]; ids: readonly string[] };

type BuilderChoicesProps = {
  cls: CharacterClass;
  picks: Picks;
  onChange: (selection: ChoiceSelection) => void;
  onPreview: (preview: BuilderPreviewSelection) => void;
};

type ChoiceGroupProps = {
  cls: CharacterClass;
  rule: ChoiceRule;
  picked: readonly string[];
  onChange: (ids: readonly string[]) => void;
  onPreview: (preview: BuilderPreviewSelection) => void;
};

function choiceDescription(rule: ChoiceRule) {
  if (rule.optional) return `Optional — choose up to ${rule.pick}.`;
  return `Choose ${rule.pick}.`;
}

type ChoiceDetailsInput = { id: string; kind: ChoiceRule["from"]["kind"] };

function choiceDetails({ id, kind }: ChoiceDetailsInput) {
  const weapon = kind === "weapon" ? weapons.find({ id }) : undefined;
  const spell = kind === "spell" ? spells.get({ id }) : undefined;
  const name = weapon?.name ?? spell?.name ?? id;
  const stat = weapon
    ? `${weapon.damage.dice} · ${weapon.mastery}`
    : `${spell?.school} · ${spell?.castingTime}`;
  return { name, stat };
}

type ChoiceOptionProps = Omit<ChoiceGroupProps, "cls"> & { id: string };

function ChoiceOption({ id, rule, picked, onChange, onPreview }: ChoiceOptionProps) {
  const { name, stat } = choiceDetails({ id, kind: rule.from.kind });
  const checked = picked.includes(id);
  const disabled = !checked && picked.length >= rule.pick;

  const toggle = () => {
    const updated = checked ? picked.filter((pick) => pick !== id) : [...picked, id];
    onChange(updated);
  };

  return (
    <li className={styles.option}>
      <label className={styles.check}>
        <input
          type="checkbox"
          aria-label={name}
          checked={checked}
          disabled={disabled}
          onChange={toggle}
        />
      </label>
      <div className={styles.details}>
        <button
          type="button"
          className={styles.preview}
          aria-label={`Preview ${name}`}
          onClick={(event) => onPreview({ kind: rule.from.kind, id, trigger: event.currentTarget })}
        >
          {name}
        </button>
        <span className={styles.stat}>{stat}</span>
      </div>
    </li>
  );
}

function ChoiceGroup({ cls, rule, picked, onChange, onPreview }: ChoiceGroupProps) {
  const descriptionId = useId();
  const options = choices.options({ cls, rule });

  return (
    <fieldset className={styles.group} aria-describedby={descriptionId}>
      <legend>{rule.label}</legend>
      <p id={descriptionId}>{choiceDescription(rule)}</p>
      <output aria-live="polite">
        {picked.length} of {rule.pick} chosen
      </output>
      <ul className={styles.options}>
        {options.map((id) => (
          <ChoiceOption
            key={id}
            id={id}
            rule={rule}
            picked={picked}
            onChange={onChange}
            onPreview={onPreview}
          />
        ))}
      </ul>
    </fieldset>
  );
}

/**
 * Renders the class's level-one choices and independent card previews.
 * - Required and optional groups both enforce their selection limits.
 * Throws on no expected input.
 */
export function BuilderChoices({ cls, picks, onChange, onPreview }: BuilderChoicesProps) {
  const rules = choices.for({ cls, level: 1 });
  return (
    <>
      {rules.map((rule) => (
        <ChoiceGroup
          key={`${cls}-${rule.id}`}
          cls={cls}
          rule={rule}
          picked={picks[rule.id] ?? []}
          onChange={(ids) => onChange({ ruleId: rule.id, ids })}
          onPreview={onPreview}
        />
      ))}
    </>
  );
}
