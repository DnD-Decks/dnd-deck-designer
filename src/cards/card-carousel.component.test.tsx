import { fireEvent, render, screen } from "@testing-library/react";
import type { CarouselEntry } from "src/cards/card-carousel.component";
import { CardCarousel } from "src/cards/card-carousel.component";
import { cardKey, cardName, cardSection, decks } from "src/decks/deck.model";
import { describe, expect, test } from "vitest";

const entries: CarouselEntry[] = decks
  .get({ cls: "fighter" })
  .cards.map((card) => ({ key: cardKey(card), card, section: cardSection(card) }));

// one Second Wind token (Resources), Fighting Style and Weapon Mastery (Class Features)
const THREE_KEYS = [
  "resource-fighter-second-wind-short-rest",
  "feat-fighter-fighting-style",
  "feat-fighter-weapon-mastery",
];
const three = entries.filter(({ key }) => THREE_KEYS.includes(key));

describe("<CardCarousel />", () => {
  test("the region and each slide carry the carousel roles and names", () => {
    render(<CardCarousel label="Fighter cards" entries={three} />);

    const carousel = screen.getByRole("region", { name: "Fighter cards" });
    expect(carousel.getAttribute("aria-roledescription")).toBe("carousel");
    screen.getByRole("group", { name: "1 of 3: Second Wind (Short Rest)" });
    screen.getByRole("group", { name: "3 of 3: Weapon Mastery" });
  });

  test("Next and Previous move the position line and disable at the ends", () => {
    render(<CardCarousel label="Fighter cards" entries={three} />);
    const previous = screen.getByRole("button", { name: "Previous card" });
    const next = screen.getByRole("button", { name: "Next card" });

    screen.getByText("Resources · 1 / 3");
    expect((previous as HTMLButtonElement).disabled).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);
    screen.getByText("Class Features · 2 / 3");
    expect((previous as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);
    screen.getByText("Class Features · 3 / 3");
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(previous);
    screen.getByText("Class Features · 2 / 3");
  });

  test("a thumbnail jumps to its card and is marked current", () => {
    render(<CardCarousel label="Fighter cards" entries={three} />);
    const thumb = screen.getByRole("button", { name: "Go to Weapon Mastery" });
    expect(thumb.getAttribute("aria-current")).toBe("false");

    fireEvent.click(thumb);
    screen.getByText("Class Features · 3 / 3");
    expect(thumb.getAttribute("aria-current")).toBe("true");
  });

  test("← / → on the region step one card", () => {
    render(<CardCarousel label="Fighter cards" entries={three} />);
    const carousel = screen.getByRole("region", { name: "Fighter cards" });

    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    screen.getByText("Class Features · 2 / 3");

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    screen.getByText("Resources · 1 / 3");
  });

  test("the card prop makes the centred card a button with its name and pressed state", () => {
    const tapped: string[] = [];
    render(
      <CardCarousel
        label="Fighter cards"
        entries={three}
        card={(entry) => ({
          name: `Pick ${cardName(entry.card)}`,
          pressed: entry.key === three[0].key,
          onTap: () => tapped.push(entry.key),
        })}
      />
    );

    const centred = screen.getByRole("button", { name: "Pick Second Wind (Short Rest)" });
    expect(centred.getAttribute("aria-pressed")).toBe("true");
    // only the centred slide is tappable
    expect(screen.queryByRole("button", { name: "Pick Fighting Style" })).toBeNull();

    fireEvent.click(centred);
    expect(tapped).toEqual([three[0].key]);

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    const moved = screen.getByRole("button", { name: "Pick Fighting Style" });
    expect(moved.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("button", { name: "Pick Second Wind (Short Rest)" })).toBeNull();
  });

  test("below renders for the current entry only", () => {
    render(
      <CardCarousel
        label="Fighter cards"
        entries={three}
        below={(entry) => <p>Under {entry.key}</p>}
      />
    );

    expect(screen.getAllByText(/^Under /)).toHaveLength(1);
    screen.getByText(`Under ${three[0].key}`);

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    screen.getByText(`Under ${three[1].key}`);
    expect(screen.queryByText(`Under ${three[0].key}`)).toBeNull();
  });

  test("a shrinking deck clamps the position to the last card", () => {
    const { rerender } = render(<CardCarousel label="Fighter cards" entries={three} />);
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    screen.getByText("Class Features · 3 / 3");

    rerender(<CardCarousel label="Fighter cards" entries={three.slice(0, 2)} />);
    screen.getByText("Class Features · 2 / 2");
  });

  test("the card prop returning undefined leaves the centred card non-tappable", () => {
    render(<CardCarousel label="Fighter cards" entries={three} card={() => undefined} />);

    // the card face is still there, just not a button
    screen.getByRole("article", { name: "Second Wind (Short Rest)" });
    expect(screen.queryByRole("button", { name: "Second Wind (Short Rest)" })).toBeNull();
  });
});
