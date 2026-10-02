import { useId, useRef, useState } from "react";
import { CardSpotlight } from "src/cards/card-spotlight.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponCard } from "src/cards/weapon-card.component";
import type { Picks } from "src/characters/character.model";
import type { ChoiceRule, ChoiceSource } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import styles from "./character-builder.module.css";

export type ChoiceSelection = { ruleId: ChoiceRule["id"]; ids: readonly string[] };

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

type Held = { index: number; trigger: HTMLButtonElement };

function choiceCard({ id, kind }: { id: string; kind: ChoiceRule["from"]["kind"] }) {
  const weapon = kind === "weapon" ? weapons.find({ id }) : undefined;
  if (weapon) return { name: weapon.name, card: <WeaponCard weapon={weapon} /> };
  const spell = spells.get({ id });
  return { name: spell.name, card: <SpellCard spell={spell} /> };
}

type ChoiceSlotProps = Omit<ChoiceGroupProps, "cls"> & {
  id: string;
  zoomTriggers: Map<string, HTMLButtonElement>;
  onZoom: () => void;
};

function ChoiceSlot({ id, rule, picked, zoomTriggers, onChange, onZoom }: ChoiceSlotProps) {
  const { name, card } = choiceCard({ id, kind: rule.from.kind });
  const checked = picked.includes(id);
  const disabled = !checked && picked.length >= rule.pick;

  const toggle = () => onChange(checked ? picked.filter((pick) => pick !== id) : [...picked, id]);

  return (
    <div className={styles.slot}>
      {card}
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
        ref={(element) => {
          if (element) zoomTriggers.set(id, element);
          return () => {
            zoomTriggers.delete(id);
          };
        }}
        onClick={onZoom}
      />
    </div>
  );
}

function ChoiceGroup({ cls, rule, picked, onChange }: ChoiceGroupProps) {
  const hintId = useId();
  const options = choices.options({ cls, rule });
  const hint = rule.optional ? `Optional — choose up to ${rule.pick}.` : `Choose ${rule.pick}.`;
  const zoomTriggers = useRef(new Map<string, HTMLButtonElement>());
  const [held, setHeld] = useState<Held | null>(null);
  const heldId = held && options[held.index];
  const heldCard = heldId && choiceCard({ id: heldId, kind: rule.from.kind });

  const hold = (index: number) => {
    const id = options[index];
    const trigger = id && zoomTriggers.current.get(id);
    if (trigger) setHeld({ index, trigger });
  };

  const neighbour = (index: number) => {
    const id = options[index];
    if (!id) return undefined;
    return { name: choiceCard({ id, kind: rule.from.kind }).name, hold: () => hold(index) };
  };

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
        {options.map((id, index) => (
          <ChoiceSlot
            key={id}
            id={id}
            rule={rule}
            picked={picked}
            zoomTriggers={zoomTriggers.current}
            onChange={onChange}
            onZoom={() => hold(index)}
          />
        ))}
      </div>
      {held && heldCard && (
        <CardSpotlight
          label={heldCard.name}
          liftedFrom={held.trigger}
          previous={neighbour(held.index - 1)}
          next={neighbour(held.index + 1)}
          onClose={() => setHeld(null)}
        >
          {heldCard.card}
        </CardSpotlight>
      )}
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
