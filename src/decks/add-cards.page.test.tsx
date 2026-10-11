import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { beforeEach, describe, expect, test } from "vitest";
import { memoryLocation } from "wouter/memory-location";

const renderAt = (path: string) => {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

beforeEach(() => {
  localStorage.clear();
  characterStorage.save(brunhilde());
});

const last = (memory: ReturnType<typeof renderAt>) => memory.history.slice(-1);

describe("<AddCardsPage />", () => {
  test("the bare add route redirects to the character's class", () => {
    renderAt("/character/f1/add");
    screen.getByRole("region", { name: "Fighter cards" });
  });

  test("an unknown character goes home; an unknown class falls back to the character's", () => {
    const memory = renderAt("/character/nobody/add/wizard");
    expect(last(memory)).toEqual(["/"]);

    renderAt("/character/f1/add/not-a-class");
    screen.getByRole("region", { name: "Fighter cards" });
  });

  test("tapping the centred card selects it, and the count appears", () => {
    renderAt("/character/f1/add");
    expect(screen.queryByRole("button", { name: /add to brünhilde/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Go to Second Wind" }));
    const card = screen.getByRole("button", { name: "Second Wind" });
    fireEvent.click(card);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    screen.getByRole("button", { name: "Add to Brünhilde (1)" });

    fireEvent.click(card);
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: /add to brünhilde/i })).toBeNull();
  });

  test("the selection survives switching class, and confirm saves every pick", () => {
    const memory = renderAt("/character/f1/add");

    fireEvent.click(screen.getByRole("button", { name: "Go to Second Wind" }));
    fireEvent.click(screen.getByRole("button", { name: "Second Wind" }));
    fireEvent.click(screen.getByRole("button", { name: /cleric/i }));
    fireEvent.click(screen.getByRole("button", { name: "Go to Cure Wounds" }));
    fireEvent.click(screen.getByRole("button", { name: "Cure Wounds" }));

    fireEvent.click(screen.getByRole("button", { name: "Add to Brünhilde (2)" }));

    expect(last(memory)).toEqual(["/character/f1"]);
    expect(characterStorage.get("f1")?.picks.custom).toEqual([
      "resource-fighter-second-wind",
      "spell-cure-wounds",
    ]);
    // the play view shows them — Cure Wounds landed in its natural section
    screen.getByRole("button", { name: "Go to Cure Wounds" });
  });

  test("confirming merges with the custom cards already picked", () => {
    characterStorage.save({
      ...brunhilde(),
      picks: { ...brunhilde().picks, custom: ["spell-cure-wounds"] },
    });
    renderAt("/character/f1/add");

    fireEvent.click(screen.getByRole("button", { name: "Go to Second Wind" }));
    fireEvent.click(screen.getByRole("button", { name: "Second Wind" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to Brünhilde (1)" }));

    expect(characterStorage.get("f1")?.picks.custom).toEqual([
      "spell-cure-wounds",
      "resource-fighter-second-wind",
    ]);
  });

  test("Cancel returns to the character without saving anything", () => {
    const memory = renderAt("/character/f1/add");

    fireEvent.click(screen.getByRole("button", { name: "Go to Second Wind" }));
    fireEvent.click(screen.getByRole("button", { name: "Second Wind" }));
    fireEvent.click(screen.getByRole("link", { name: "Cancel" }));

    expect(last(memory)).toEqual(["/character/f1"]);
    expect(characterStorage.get("f1")?.picks.custom).toBeUndefined();
  });
});
