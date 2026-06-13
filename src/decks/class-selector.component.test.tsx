import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ClassSelector } from "./class-selector.component.tsx";

test("renders one button per character class (12 total)", () => {
  render(<ClassSelector selected="wizard" onSelect={() => {}} />);
  expect(screen.getAllByRole("button")).toHaveLength(12);
});

test("nav has accessible label 'Character class'", () => {
  render(<ClassSelector selected="wizard" onSelect={() => {}} />);
  screen.getByRole("navigation", { name: "Character class" });
});

test("selected class button has aria-pressed=true", () => {
  render(<ClassSelector selected="wizard" onSelect={() => {}} />);
  const btn = screen.getByRole("button", { name: "Wizard" });
  expect(btn.getAttribute("aria-pressed")).toBe("true");
});

test("non-selected class buttons have aria-pressed=false", () => {
  render(<ClassSelector selected="wizard" onSelect={() => {}} />);
  const btn = screen.getByRole("button", { name: "Barbarian" });
  expect(btn.getAttribute("aria-pressed")).toBe("false");
});

test("clicking a class button calls onSelect with that class id", () => {
  let called = "";
  render(
    <ClassSelector
      selected="wizard"
      onSelect={(cls) => {
        called = cls;
      }}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Barbarian" }));
  expect(called).toBe("barbarian");
});
