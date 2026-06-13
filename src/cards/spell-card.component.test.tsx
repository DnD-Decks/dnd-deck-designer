import { render, screen } from "@testing-library/react";
import { spells } from "src/models/spells/spells.model";
import { test } from "vitest";
import { SpellCard } from "./spell-card.component.tsx";

const fireBolt = spells.get({ id: "fire-bolt" });
const magicMissile = spells.get({ id: "magic-missile" });

test("spell name renders as an h3 heading", () => {
  render(<SpellCard spell={fireBolt} />);
  screen.getByRole("heading", { name: /fire bolt/i, level: 3 });
});

test("card is an article landmark labeled by the spell name", () => {
  render(<SpellCard spell={fireBolt} />);
  screen.getByRole("article", { name: /fire bolt/i });
});

test("type line shows school and level label", () => {
  render(<SpellCard spell={fireBolt} />);
  screen.getByText(/evocation/i);
  screen.getByText(/cantrip/i);
});

test("level-1 spell shows 'Level 1' in the type line", () => {
  render(<SpellCard spell={magicMissile} />);
  screen.getByText(/level 1/i);
});

test("description text is rendered", () => {
  render(<SpellCard spell={fireBolt} />);
  screen.getByText(fireBolt.description.slice(0, 20), { exact: false });
});
