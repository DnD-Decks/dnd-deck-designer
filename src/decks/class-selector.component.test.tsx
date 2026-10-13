import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ClassSelector } from "./class-selector.component.tsx";

const nav = () => within(screen.getByRole("navigation", { name: "Character class" }));

describe("<ClassSelector />", () => {
  test("the nav offers one toggle per class", () => {
    render(<ClassSelector selected="wizard" onSelect={() => {}} />);

    const names = [
      "Barbarian",
      "Bard",
      "Cleric",
      "Druid",
      "Fighter",
      "Monk",
      "Paladin",
      "Ranger",
      "Rogue",
      "Sorcerer",
      "Warlock",
      "Wizard",
    ];

    // exact names, render order and no extras in one assertion
    expect(nav().getAllByRole("button")).toEqual(
      names.map((name) => nav().getByRole("button", { name }))
    );
  });

  test("each class names its role and hit die as the description", () => {
    render(<ClassSelector selected="wizard" onSelect={() => {}} />);

    nav().getByRole("button", { name: "Wizard", description: "spell-caster d6" });
    nav().getByRole("button", { name: "Barbarian", description: "martial d12" });
  });

  test("only the selected class is pressed", () => {
    render(<ClassSelector selected="wizard" onSelect={() => {}} />);

    expect(nav().getAllByRole("button", { pressed: true })).toEqual([
      nav().getByRole("button", { name: "Wizard" }),
    ]);
  });

  test("clicking a class reports its id", () => {
    const onSelect = vi.fn();
    render(<ClassSelector selected="wizard" onSelect={onSelect} />);

    fireEvent.click(nav().getByRole("button", { name: "Barbarian" }));

    expect(onSelect).toHaveBeenCalledWith("barbarian");
  });
});
