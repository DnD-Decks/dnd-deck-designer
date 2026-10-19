import {
  cleanup,
  fireEvent,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { characterStorage } from "src/services/character.storage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  renderAt,
  restsDisabled,
  seedBrunhildeOnGrid,
  showCarousel,
  spend,
  zoomNames,
} from "./character-page.fixture.tsx";

const SHORT = "Second Wind (Short Rest)";
const LONG = "Second Wind (Long Rest)";
// the two Second Wind tokens, not the Second Wind action that spends them
const tokenZooms = () => zoomNames("Second Wind \\(");

beforeEach(seedBrunhildeOnGrid);
afterEach(() => vi.restoreAllMocks());

describe("<CharacterPage />", () => {
  describe("spend{}", () => {
    test("rests wait until something is spent, and say what they bring back", () => {
      renderAt("/character/f1");
      expect(restsDisabled()).toEqual({ short: true, long: true });
    });

    test("Spend in the spotlight puts the card back spent; Recover undoes it", async () => {
      renderAt("/character/f1");
      await spend(SHORT);
      expect(tokenZooms()).toEqual([`Zoom ${SHORT}, spent`, `Zoom ${LONG}`]);

      fireEvent.click(screen.getByRole("button", { name: `Zoom ${SHORT}, spent` }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Recover" }));
      await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
      expect(tokenZooms()).toEqual([`Zoom ${SHORT}`, `Zoom ${LONG}`]);
    });

    test("only resources can be spent", () => {
      renderAt("/character/f1");
      fireEvent.click(screen.getByRole("button", { name: "Zoom Shortbow" }));
      const spotlight = within(screen.getByRole("dialog", { name: "Shortbow" }));
      expect(spotlight.queryByRole("button", { name: "Spend" })).toBeNull();
    });

    test("a short rest brings back the short-rest Second Wind and says so", async () => {
      renderAt("/character/f1");
      await spend(SHORT);
      await spend(LONG);

      fireEvent.click(screen.getByRole("button", { name: "Short rest" }));

      expect(tokenZooms()).toEqual([`Zoom ${SHORT}`, `Zoom ${LONG}, spent`]);
      const status = screen.getByText("Short rest: Second Wind recovered");
      expect(screen.getAllByRole("status")).toContain(status);
    });

    test("a long rest brings everything back", async () => {
      renderAt("/character/f1");
      await spend(SHORT);
      await spend(LONG);

      fireEvent.click(screen.getByRole("button", { name: "Long rest" }));

      expect(tokenZooms()).toEqual([`Zoom ${SHORT}`, `Zoom ${LONG}`]);
      expect(restsDisabled()).toEqual({ short: true, long: true });
    });

    test("a spent card no longer in the deck is forgotten", () => {
      characterStorage.setSpent({
        id: "f1",
        spent: ["weapon-greataxe-0", "resource-fighter-second-wind-short-rest-0"],
      });
      renderAt("/character/f1");
      expect(characterStorage.spent("f1")).toEqual(["resource-fighter-second-wind-short-rest-0"]);
    });

    test("spent cards are still spent after a reload", async () => {
      renderAt("/character/f1");
      await spend(SHORT);
      cleanup();

      renderAt("/character/f1");
      expect(tokenZooms()).toEqual([`Zoom ${SHORT}, spent`, `Zoom ${LONG}`]);
    });
  });

  describe("carousel spend{}", () => {
    test("Spend under a resource card marks it spent; Recover undoes it", () => {
      showCarousel();
      renderAt("/character/f1");

      const actions = () => screen.getByRole("group", { name: `${SHORT} actions` });
      fireEvent.click(within(actions()).getByRole("button", { name: "Spend" }));
      screen.getByRole("button", { name: `${SHORT}, spent` });
      // the slide and its thumbnail both carry the Spent mark
      screen.getAllByText("Spent");

      fireEvent.click(within(actions()).getByRole("button", { name: "Recover" }));
      screen.getByRole("button", { name: SHORT });
      expect(screen.queryByText("Spent")).toBeNull();
    });

    test("tapping a spendable card pulses the actions under it", () => {
      showCarousel();
      renderAt("/character/f1");

      const actions = () => screen.getByRole("group", { name: `${SHORT} actions` });
      expect(actions().getAttribute("data-nudge")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: SHORT }));
      expect(actions().getAttribute("data-nudge")).not.toBeNull();
    });

    test("the nudge clears when its animation ends", () => {
      showCarousel();
      renderAt("/character/f1");

      const actions = () => screen.getByRole("group", { name: `${SHORT} actions` });
      fireEvent.click(screen.getByRole("button", { name: SHORT }));
      expect(actions().getAttribute("data-nudge")).not.toBeNull();

      fireEvent.animationEnd(actions());
      expect(actions().getAttribute("data-nudge")).toBeNull();
    });

    test("a card with no actions is not a button and shows no actions", () => {
      showCarousel();
      renderAt("/character/f1");

      fireEvent.click(screen.getByRole("button", { name: "Go to Longsword" }));
      screen.getByText(/Weapons · \d+ \/ \d+/);
      expect(screen.queryByRole("button", { name: "Longsword" })).toBeNull();
      expect(screen.queryByRole("group", { name: "Longsword actions" })).toBeNull();
    });
  });
});
