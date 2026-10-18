import { render, screen, within } from "@testing-library/react";
import { spells } from "src/models/spells/spells.model";
import { describe, expect, test } from "vitest";
import { SpellCard } from "./spell-card.component.tsx";

const fireBolt = spells.get({ id: "fire-bolt" });
const magicMissile = spells.get({ id: "magic-missile" });
const detectMagic = spells.get({ id: "detect-magic" });

describe("<SpellCard />", () => {
  test("the card is an article labeled by the spell name", () => {
    render(<SpellCard spell={fireBolt} />);

    screen.getByRole("article", { name: "Fire Bolt" });
    screen.getByRole("heading", { name: "Fire Bolt", level: 3 });
  });

  test.each([
    { spell: fireBolt, typeLine: "Evocation · Cantrip" },
    { spell: magicMissile, typeLine: "Evocation · Level 1" },
  ])("the type line reads '$typeLine'", ({ spell, typeLine }) => {
    render(<SpellCard spell={spell} />);

    screen.getByText(typeLine);
  });

  test("concentration and ritual spells carry their tags", () => {
    render(<SpellCard spell={detectMagic} />);

    screen.getByRole("img", { name: "Concentration" });
    screen.getByRole("img", { name: "Ritual" });
  });

  test("a spell without concentration or ritual shows no tags", () => {
    render(<SpellCard spell={fireBolt} />);

    expect(screen.queryByRole("img", { name: "Concentration" })).toBeNull();
    expect(screen.queryByRole("img", { name: "Ritual" })).toBeNull();
  });

  test("shows the visible facts: description, range, duration and header damage", () => {
    render(<SpellCard spell={fireBolt} />);

    screen.getByText(fireBolt.description.slice(0, 20), { exact: false });
    screen.getByText("120 ft");
    screen.getByText("Instantaneous");
    within(screen.getByRole("region", { name: "Damage" })).getByText("1d10");
  });
});
