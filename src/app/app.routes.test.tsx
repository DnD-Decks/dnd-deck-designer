import { fireEvent, render, screen } from "@testing-library/react";
import { elminster } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { beforeEach, describe, expect, test } from "vitest";
import { memoryLocation } from "wouter/memory-location";
import { App } from "./app.component.tsx";

const renderAt = (path: string) => {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

beforeEach(() => {
  localStorage.clear();
});

describe("<AppRoutes />", () => {
  test("home shows your characters, and the empty state points to the catalog", () => {
    renderAt("/");
    screen.getByRole("heading", { name: "Your characters", level: 2 });
    screen.getByRole("link", { name: "Open the card catalog" });
    expect(screen.getByRole("link", { name: "Your characters" }).getAttribute("aria-current")).toBe(
      "page"
    );
  });

  test("home lists saved characters and links to each one", () => {
    characterStorage.save(elminster());
    const memory = renderAt("/");
    expect(screen.queryByRole("link", { name: "Open the card catalog" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: /Elminster/ }));
    expect(memory.history.slice(-1)).toEqual(["/character/w1"]);
  });

  test("the catalog opens the class in the path", () => {
    renderAt("/catalog/fighter");
    expect(screen.getByRole("button", { name: /fighter/i }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    screen.getByRole("article", { name: "Second Wind" });
  });

  test.each([
    { label: "a bare catalog", from: "/catalog", to: "/catalog/wizard" },
    { label: "an unknown class", from: "/catalog/illithid", to: "/catalog/wizard" },
    { label: "a legacy #fighter link", from: "/fighter", to: "/catalog/fighter" },
    { label: "an unknown path", from: "/illithid", to: "/" },
  ])("redirects $label to $to", ({ from, to }) => {
    const memory = renderAt(from);
    expect(memory.history.slice(-1)).toEqual([to]);
  });

  test("picking a class in the catalog moves the path", () => {
    const memory = renderAt("/catalog/wizard");
    fireEvent.click(screen.getByRole("button", { name: /druid/i }));
    expect(memory.history.slice(-1)).toEqual(["/catalog/druid"]);
  });
});
