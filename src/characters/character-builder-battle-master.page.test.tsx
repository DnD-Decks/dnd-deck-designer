import { fireEvent, screen, within } from "@testing-library/react";
import {
  button,
  checkbox,
  click,
  nameCharacter,
  next,
  pickClass,
  renderAt,
  selectFighterWeapons,
} from "src/characters/character-builder-page.fixture";
import { brunhilde } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { beforeEach, describe, expect, test } from "vitest";

const choose = ({ name, value }: { name: string; value: string }) =>
  fireEvent.change(screen.getByRole("combobox", { name }), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("dnd-deck-designer:view-mode", "grid");
});

describe("Battle Master builder", () => {
  test("offers subclasses at Fighter level three and requires three maneuvers before building", () => {
    renderAt();
    pickClass("Fighter");
    expect(screen.queryByRole("combobox", { name: "Subclass" })).toBeNull();
    choose({ name: "Character level", value: "3" });
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Subclass" }).value).toBe(
      "champion"
    );
    choose({ name: "Subclass", value: "battle-master" });
    next();
    expect(button("Next").disabled).toBe(true);
    const group = within(screen.getByRole("group", { name: "Maneuvers" }));
    for (const name of ["Precision Attack", "Riposte", "Trip Attack"])
      fireEvent.click(group.getByRole("checkbox", { name }));
    expect(checkbox("Parry").disabled).toBe(true);
    next();
    selectFighterWeapons();
    nameCharacter("Battle Tactician");
    click("Build deck");
    const saved = characterStorage.list()[0];
    expect(saved?.subclass).toBe("battle-master");
    expect(saved?.picks.maneuvers).toEqual([
      "fighter-precision-attack",
      "fighter-riposte",
      "fighter-trip-attack",
    ]);
    screen.getByText("Level 3 Fighter · Battle Master");
    expect(screen.getAllByRole("article", { name: "Superiority Die" })).toHaveLength(4);
    screen.getByRole("article", { name: "Riposte" });
    expect(screen.queryByRole("article", { name: "Improved Critical" })).toBeNull();
  });

  test("editing an older level-three Fighter defaults to Champion and can switch to Battle Master", () => {
    const hero = { ...brunhilde(), level: 3 as const };
    characterStorage.save(hero);
    renderAt("/character/f1/edit");
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Subclass" }).value).toBe(
      "champion"
    );
    choose({ name: "Subclass", value: "battle-master" });
    next();
    for (const name of ["Parry", "Rally", "Lunging Attack"]) fireEvent.click(checkbox(name));
    click("Back");
    choose({ name: "Subclass", value: "champion" });
    next();
    expect(checkbox("Longsword").checked).toBe(true);
    click("Build deck");
    expect(characterStorage.get("f1")?.picks.maneuvers).toBeUndefined();
    screen.getByRole("article", { name: "Improved Critical" });
    expect(screen.queryByRole("article", { name: "Superiority Die" })).toBeNull();
  });
});
