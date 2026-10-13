import { render, screen } from "@testing-library/react";
import { resources } from "src/models/resources/resources.model";
import { describe, expect, test } from "vitest";
import { ResourceCard } from "./resource-card.component.tsx";

const rage = resources.findAll({ cls: "barbarian" })[0];
const wizardMana = resources.findAll({ cls: "wizard" })[0];

describe("<ResourceCard />", () => {
  test("the card is an article labeled by the resource name", () => {
    render(<ResourceCard resource={rage} />);
    screen.getByRole("article", { name: "Rage" });
    screen.getByRole("heading", { name: "Rage", level: 3 });
  });

  test("the resource icon is an image named after the resource", () => {
    render(<ResourceCard resource={rage} />);
    expect(screen.getByRole("img", { name: "Rage" }).getAttribute("src")).toBe(rage.icon);
  });

  test("a timed resource shows the action glyph and its label", () => {
    render(<ResourceCard resource={rage} />);
    screen.getByRole("img", { name: "Bonus Action" });
    screen.getByText("Bonus Action");
  });

  test("a resource without timing shows only the recharge", () => {
    render(<ResourceCard resource={wizardMana} />);
    expect(screen.queryByRole("img", { name: /action/i })).toBeNull();
    screen.getByText(/recharges: long rest/i);
  });

  test("a resource without icon renders no resource image", () => {
    render(<ResourceCard resource={{ ...rage, icon: undefined, action: undefined }} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  [
    {
      label: "a pool reads as the rule that sizes it",
      pool: "5 × Paladin level",
      expected: "Pool: 5 × Paladin level",
    },
    { label: "a resource without a pool shows no pool", pool: undefined, expected: null },
  ].forEach(({ label, pool, expected }) => {
    test(label, () => {
      render(<ResourceCard resource={{ ...rage, pool }} />);
      expect(screen.queryByText(/^Pool:/)?.textContent ?? null).toBe(expected);
    });
  });
});
