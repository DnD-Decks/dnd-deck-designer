import { fireEvent, screen, within } from "@testing-library/react";
import {
  button,
  checkbox,
  click,
  completeRequired,
  nameCharacter,
  next,
  pickClass,
  renderAt,
} from "src/characters/character-builder-page.fixture";
import { brunhilde } from "src/characters/character.fixture";
import type { CharacterLevel } from "src/models/class/progression.model";
import { characterStorage } from "src/services/character.storage";
import { beforeEach, describe, expect, test } from "vitest";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("dnd-deck-designer:view-mode", "grid");
});

describe("levels{}", () => {
  const chooseLevel = (level: CharacterLevel) =>
    fireEvent.change(screen.getByRole("combobox", { name: "Character level" }), {
      target: { value: String(level) },
    });

  test("upgrading keeps custom cards and the character's play state", () => {
    const hero = brunhilde();
    characterStorage.save({ ...hero, picks: { ...hero.picks, custom: ["spell-cure-wounds"] } });
    characterStorage.setSpent({ id: hero.id, spent: ["resource-fighter-second-wind-0"] });
    renderAt("/character/f1/edit");
    chooseLevel(3);
    next();
    next();
    screen.getByRole("article", { name: "Cure Wounds" });
    click("Build deck");
    expect(characterStorage.get(hero.id)?.picks.custom).toEqual(["spell-cure-wounds"]);
    expect(characterStorage.get(hero.id)?.level).toBe(3);
    expect(characterStorage.spent(hero.id)).toEqual(["resource-fighter-second-wind-0"]);
  });

  test("creates a level-three wizard with mixed spell levels and its Evoker features", () => {
    renderAt();
    chooseLevel(3);
    pickClass("Wizard");
    screen.getByText(/Includes Evoker/);
    next();
    for (const name of [
      "Fire Bolt",
      "Light",
      "Mage Hand",
      "Shield",
      "Magic Missile",
      "Mage Armor",
      "Detect Magic",
      "Burning Hands",
      "Misty Step",
    ])
      fireEvent.click(checkbox(name));
    expect(button("Next").disabled).toBe(false);
    next();
    nameCharacter("Third Circle");
    click("Build deck");
    expect(characterStorage.list()[0]?.level).toBe(3);
    screen.getByText("Level 3 Wizard · Evoker");
    screen.getByRole("article", { name: "Misty Step" });
    screen.getByRole("article", { name: "Potent Cantrip" });
    expect(screen.getAllByRole("article", { name: "Level 2 Mana" })).toHaveLength(2);
  });

  test("upgrading an existing fighter retains identity and weapon choices", () => {
    characterStorage.save(brunhilde());
    renderAt("/character/f1/edit");
    chooseLevel(2);
    next();
    expect(checkbox("Longsword").checked).toBe(true);
    click("Build deck");
    expect(characterStorage.get("f1")?.level).toBe(2);
    screen.getByRole("article", { name: "Action Surge" });
    expect(screen.queryByRole("article", { name: "Improved Critical" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Edit" }));
    chooseLevel(3);
    next();
    click("Build deck");
    expect(characterStorage.get("f1")?.level).toBe(3);
    screen.getByRole("article", { name: "Improved Critical" });
  });

  test("reducing a wizard's level clears unavailable spells while keeping valid picks", () => {
    characterStorage.save({
      id: "w3",
      name: "Merlin",
      cls: "wizard",
      level: 3,
      picks: {
        cantrips: ["fire-bolt", "light", "mage-hand"],
        prepared: [
          "misty-step",
          "shield",
          "mage-armor",
          "magic-missile",
          "burning-hands",
          "detect-magic",
        ],
      },
    });
    renderAt("/character/w3/edit");
    chooseLevel(1);
    next();
    expect(screen.queryByRole("checkbox", { name: "Misty Step" })).toBeNull();
    expect(checkbox("Shield").checked).toBe(true);
    expect(button("Next").disabled).toBe(false);
    next();
    click("Build deck");
    expect(characterStorage.get("w3")?.level).toBe(1);
    expect(characterStorage.get("w3")?.picks.prepared).toEqual([
      "shield",
      "mage-armor",
      "magic-missile",
      "burning-hands",
    ]);
  });

  test("a druid's land grants spells without spending its six prepared choices", () => {
    renderAt();
    pickClass("Druid");
    chooseLevel(3);
    fireEvent.change(screen.getByRole("combobox", { name: "Land type" }), {
      target: { value: "arid" },
    });
    next();
    const automatic = within(screen.getByRole("region", { name: "Always prepared" }));
    automatic.getByRole("article", { name: "Blur" });
    automatic.getByRole("article", { name: "Fire Bolt" });
    expect(automatic.queryByRole("checkbox")).toBeNull();
    completeRequired({ cls: "druid", kind: "spell", level: 3 });
    next();
    nameCharacter("Desert Druid");
    click("Build deck");
    expect(characterStorage.list()[0]?.land).toBe("arid");
    screen.getByRole("article", { name: "Blur" });
  });
});
