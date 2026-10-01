import { useCallback, useId, useState } from "react";
import { CardSpotlight } from "src/cards/card-spotlight.component";
import { SpellCard } from "src/cards/spell-card.component";
import { WeaponCard } from "src/cards/weapon-card.component";
import type { Character, Picks } from "src/characters/character.model";
import { characters } from "src/characters/character.model";
import type { ChoiceIssue, ChoiceRule } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import { Icon } from "src/lib/icon.component";
import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import { characterStorage } from "src/services/character.storage";
import { Link, useLocation } from "wouter";
import styles from "./character-builder.module.css";

const ALL_CLASSES = classes.list();
const STEPS = [
  { label: "Class", index: 0 },
  { label: "Choices", index: 1 },
  { label: "Name", index: 2 },
];
type Preview = { kind: "weapon" | "spell"; id: string; trigger: HTMLElement };

function issueMessage(issue: ChoiceIssue) {
  switch (issue.problem) {
    case "missing":
      return `${issue.rule.label}: choose ${issue.count} more.`;
    case "too-many":
      return `${issue.rule.label}: remove ${issue.count} choices.`;
    case "unknown":
      return `${issue.rule.label}: remove unavailable choices.`;
  }
}

type ChoiceGroupProps = {
  cls: CharacterClass;
  rule: ChoiceRule;
  picked: readonly string[];
  onChange: (ids: readonly string[]) => void;
  onPreview: (preview: Preview) => void;
};

function choiceDescription(rule: ChoiceRule) {
  if (rule.optional) return `Optional — choose up to ${rule.pick}.`;
  return `Choose ${rule.pick}.`;
}

function choiceDetails({ id, kind }: { id: string; kind: ChoiceRule["from"]["kind"] }) {
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

function Builder({ initial }: { initial?: Character }) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const focusStep = useCallback((heading: HTMLHeadingElement | null) => {
    heading?.focus();
  }, []);
  const [cls, setClass] = useState<CharacterClass | undefined>(initial?.cls);
  const [picks, setPicks] = useState<Picks>(initial?.picks ?? {});
  const [name, setName] = useState(initial?.name ?? "");
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const weapon = preview?.kind === "weapon" ? weapons.find({ id: preview.id }) : null;
  const spell = preview?.kind === "spell" ? spells.get({ id: preview.id }) : null;
  const nameId = useId();
  const missingId = useId();
  const issues = cls ? choices.validate({ cls, level: 1, picks }) : [];
  const missing = [
    ...(!cls ? ["Choose a class."] : []),
    ...issues.map(issueMessage),
    ...(!name.trim() ? ["Enter a character name."] : []),
  ];

  const save = () => {
    if (!cls || missing.length) return;
    const character = {
      ...(initial ?? characters.create({ cls, name: name.trim() })),
      cls,
      name: name.trim(),
      picks,
    };
    if (characterStorage.save(character)) navigate(`/character/${character.id}`);
    else setFailed(true);
  };

  return (
    <>
      <main
        className={styles.page}
        aria-hidden={preview ? true : undefined}
        inert={preview ? true : undefined}
      >
        <h2>{initial ? "Edit character" : "New character"}</h2>
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
        {step === 0 && (
          <div className={styles.classes} aria-label="Character class">
            {ALL_CLASSES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={cls === option.id}
                onClick={() => {
                  if (cls !== option.id) {
                    setClass(option.id);
                    setPicks({});
                  }
                }}
              >
                <Icon src={option.icon} label={option.label} decorative className={styles.icon} />
                {option.label}
              </button>
            ))}
          </div>
        )}
        {step === 1 &&
          cls &&
          choices
            .for({ cls, level: 1 })
            .map((rule) => (
              <ChoiceGroup
                key={`${cls}-${rule.id}`}
                cls={cls}
                rule={rule}
                picked={picks[rule.id] ?? []}
                onChange={(ids) => setPicks((current) => ({ ...current, [rule.id]: ids }))}
                onPreview={setPreview}
              />
            ))}
        {step === 2 && (
          <>
            <label htmlFor={nameId}>Character name (required)</label>
            <input
              id={nameId}
              className={styles.name}
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </>
        )}
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
          <Link href={initial ? `/character/${initial.id}` : "/"}>Cancel</Link>
          {step > 0 && (
            <button type="button" onClick={() => setStep((current) => current - 1)}>
              Back
            </button>
          )}
          {step < 2 && (
            <button type="button" disabled={!cls} onClick={() => setStep((current) => current + 1)}>
              Next
            </button>
          )}
          {step >= 2 && (
            <button
              type="button"
              disabled={missing.length > 0}
              aria-describedby={missingId}
              onClick={save}
            >
              Save character
            </button>
          )}
        </nav>
      </main>
      {preview && (weapon || spell) && (
        <CardSpotlight
          label={weapon?.name ?? spell?.name ?? ""}
          liftedFrom={preview.trigger}
          onClose={() => setPreview(null)}
        >
          {weapon && <WeaponCard weapon={weapon} />}
          {!weapon && spell && <SpellCard spell={spell} />}
        </CardSpotlight>
      )}
    </>
  );
}

/**
 * Builds or edits a level-one character stored on this device.
 * - No id starts a new draft; a saved id loads its character.
 * - An unknown id shows a not-found page.
 * Throws on no expected input.
 */
export function CharacterBuilderPage({ id }: { id?: string }) {
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
