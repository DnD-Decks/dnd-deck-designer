import { render, screen } from "@testing-library/react";
import { resources } from "src/models/resources/resources.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { describe, expect, test } from "vitest";
import { ResourceCard } from "./resource-card.component.tsx";

const secondWind = resources.get({ id: "fighter-second-wind" });
const wizardMana = resources.get({ id: "wizard-mana" });

describe("<ResourceCard />", () => {
  test("the card is an article named by the resource and the rest that brings it back", () => {
    render(<ResourceCard resource={secondWind} recharge="long-rest" />);
    screen.getByRole("article", { name: "Second Wind (Long Rest)" });
    screen.getByRole("heading", { name: "Second Wind", level: 3 });
  });

  test("the resource's symbol is an image named after the resource", () => {
    render(<ResourceCard resource={secondWind} recharge="long-rest" />);
    expect(screen.getByRole("img", { name: "Second Wind" }).getAttribute("src")).toBe(
      secondWind.icon
    );
  });

  [
    {
      label: "a token paints resource-<id>",
      resource: secondWind,
      expected: "/art/resource-fighter-second-wind.png",
    },
    {
      label: "every mana token shares one painting",
      resource: wizardMana,
      expected: "/art/resource-mana.png",
    },
  ].forEach(({ label, resource, expected }) => {
    test(label, () => {
      render(<ResourceCard resource={resource} recharge="long-rest" />);
      // the painting and the rest icon are both presentational: the header and footer name them
      const art = screen
        .getAllByRole("presentation", { hidden: true })
        .map((img) => img.getAttribute("src"))
        .filter((src) => src?.startsWith("/art/"));
      expect(art).toEqual([expected]);
    });
  });

  test("mana shows the gem with its level instead of an icon", () => {
    render(<ResourceCard resource={wizardMana} recharge="long-rest" />);
    screen.getByRole("img", { name: "Level 1 mana" });
  });

  (
    [
      { recharge: "short-rest", expected: "Short Rest" },
      { recharge: "long-rest", expected: "Long Rest" },
    ] satisfies { recharge: RestType; expected: string }[]
  ).forEach(({ recharge, expected }) => {
    test(`a ${recharge} copy names the rest that brings it back: ${expected}`, () => {
      render(<ResourceCard resource={secondWind} recharge={recharge} />);
      screen.getByText(expected);
    });
  });
});
