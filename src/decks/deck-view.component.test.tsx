import { render, screen } from "@testing-library/react";
import { test } from "vitest";
import { DeckView } from "./deck-view.component.tsx";

test("caster deck renders inside a main landmark", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("main");
});

test("wizard deck renders a 'Cantrips' section heading", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /cantrips/i, level: 2 });
});

test("wizard deck renders a 'Level 2' section heading", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /level 2/i, level: 2 });
});

test("wizard deck contains the Fire Bolt spell card", () => {
  render(<DeckView cls="wizard" />);
  screen.getByRole("heading", { name: /fire bolt/i, level: 3 });
});

test("non-caster class renders the empty-state message", () => {
  render(<DeckView cls="barbarian" />);
  screen.getByText(/no cards vendored for barbarian/i);
});

test("empty-state deck is still inside a main landmark", () => {
  render(<DeckView cls="barbarian" />);
  screen.getByRole("main");
});
