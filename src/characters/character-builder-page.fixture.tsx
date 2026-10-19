import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "src/app/app.component";
import type { ChoiceSource } from "src/characters/choices.model";
import { choices } from "src/characters/choices.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel } from "src/models/class/progression.model";
import { feats } from "src/models/feats/feats.model";
import { weapons } from "src/models/gear/weapons.model";
import { spells } from "src/models/spells/spells.model";
import { memoryLocation } from "wouter/memory-location";

export function renderAt(path = "/new") {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
}

export const button = (name: string | RegExp) =>
  screen.getByRole<HTMLButtonElement>("button", { name });
export const click = (name: string | RegExp) => fireEvent.click(button(name));
export const pickClass = (label: string) => click(new RegExp(`^${label}`));
export const next = () => click("Next");
export const checkbox = (name: string) => screen.getByRole<HTMLInputElement>("checkbox", { name });
export const nameField = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Character name" });
export const nameCharacter = (name: string) =>
  fireEvent.change(nameField(), { target: { value: name } });
export const stepNames = () =>
  within(screen.getByRole("list", { name: "Character builder steps" }))
    .getAllByRole("listitem")
    .map((item) => ({ text: item.textContent, current: item.getAttribute("aria-current") }));

export function selectFighterWeapons() {
  fireEvent.click(checkbox("Longsword"));
  fireEvent.click(checkbox("Shortbow"));
  fireEvent.click(checkbox("Dagger"));
}

export function optionName({ kind, id }: { kind: ChoiceSource["kind"]; id: string }) {
  if (kind === "feat") return feats.get({ id }).name;
  return kind === "weapon" ? weapons.find({ id })?.name : spells.get({ id }).name;
}

export function completeRequired({
  cls,
  kind,
  level = 1,
}: { cls: CharacterClass; kind: ChoiceSource["kind"]; level?: CharacterLevel }) {
  const rules = choices
    .for({ cls, level })
    .filter((rule) => rule.from.kind === kind && !rule.optional);
  for (const rule of rules) {
    const group = within(screen.getByRole("group", { name: rule.label }));
    for (const id of choices.options({ cls, rule }).slice(0, rule.pick)) {
      fireEvent.click(group.getByRole("checkbox", { name: optionName({ kind, id }) }));
    }
  }
}
