import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ClassSelector } from "./class-selector.component.tsx";

// the label, classification and hit-die spans render adjacent, so a button's
// name is their concatenated text (the visible spacing comes from CSS)
const buttonNames = ({ pressed }: { pressed?: boolean } = {}) =>
  within(screen.getByRole("navigation", { name: "Character class" }))
    .getAllByRole("button", pressed === undefined ? {} : { pressed })
    .map((b) => b.textContent);

describe("<ClassSelector />", () => {
  test("the nav offers one toggle per class", () => {
    render(<ClassSelector selected="wizard" onSelect={() => {}} />);

    expect(buttonNames()).toEqual([
      "Barbarianmartiald12",
      "Bardspell-casterd8",
      "Clericspell-casterd8",
      "Druidspell-casterd8",
      "Fightermartiald10",
      "Monkmartiald8",
      "Paladinversatiled10",
      "Rangerversatiled10",
      "Roguemartiald8",
      "Sorcererspell-casterd6",
      "Warlockspell-casterd8",
      "Wizardspell-casterd6",
    ]);
  });

  test("only the selected class is pressed", () => {
    render(<ClassSelector selected="wizard" onSelect={() => {}} />);

    expect(buttonNames({ pressed: true })).toEqual(["Wizardspell-casterd6"]);
  });

  test("clicking a class reports its id", () => {
    const onSelect = vi.fn();
    render(<ClassSelector selected="wizard" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /^Barbarian/ }));

    expect(onSelect).toHaveBeenCalledWith("barbarian");
  });
});
