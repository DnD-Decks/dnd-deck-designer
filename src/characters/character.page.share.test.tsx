import { fireEvent, screen, within } from "@testing-library/react";
import { brunhilde } from "src/characters/character.fixture";
import { characters } from "src/characters/character.model";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  renderAt,
  seedBrunhildeOnGrid,
  sharedCode,
  stubClipboard,
} from "./character-page.fixture.tsx";

beforeEach(seedBrunhildeOnGrid);
afterEach(() => vi.restoreAllMocks());

describe("<CharacterPage />", () => {
  describe("share{}", () => {
    test("Share copies an import link that decodes back to the build", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      renderAt("/character/f1");

      fireEvent.click(screen.getByRole("button", { name: "Share" }));

      const status = await screen.findByText(/link copied/i);
      const menu = within(screen.getByRole("navigation", { name: "Character menu" }));
      expect(menu.getByRole("status")).toBe(status);
      const imported = characters.fromShareCode(sharedCode(writeText.mock.calls[0]?.[0]));
      expect({ ...imported, id: "new" }).toEqual({ ...brunhilde(), id: "new" });
    });

    test("when the clipboard refuses, the link is shown to copy by hand", async () => {
      stubClipboard(() => Promise.reject(new Error("denied")));
      renderAt("/character/f1");

      fireEvent.click(screen.getByRole("button", { name: "Share" }));

      const field = await screen.findByRole("textbox", { name: "Share link" });
      const imported = characters.fromShareCode(sharedCode((field as HTMLInputElement).value));
      expect({ ...imported, id: "new" }).toEqual({ ...brunhilde(), id: "new" });
    });
  });
});
