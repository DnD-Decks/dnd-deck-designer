import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { App } from "src/app/app.component";
import { brunhilde } from "src/characters/character.fixture";
import { characterStorage } from "src/services/character.storage";
import { memoryLocation } from "wouter/memory-location";

export const renderAt = (path: string) => {
  const memory = memoryLocation({ path, record: true });
  render(<App hook={memory.hook} />);
  return memory;
};

export const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

export const sharedCode = (link: unknown) => String(link).split("#/import/")[1] ?? "";

const inDocumentOrder = (a: Node, b: Node) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

// menuItems(menu) is ["Edit", "Share", "—", …]: links, buttons and separators as they read
export const menuItems = (menu: HTMLElement) => {
  const items = within(menu);
  const separators = items.getAllByRole("separator");
  return [...items.getAllByRole("link"), ...items.getAllByRole("button"), ...separators]
    .sort(inDocumentOrder)
    .map((item) => (separators.includes(item) ? "—" : item.textContent));
};

export const zoomNames = (card: string) =>
  screen
    .getAllByRole("button", { name: new RegExp(`^Zoom ${card}`) })
    .map((button) => button.getAttribute("aria-label"));

// each rest button names what it brings back as its description; the query fails if it doesn't
export const restsDisabled = () => ({
  short: (
    screen.getByRole("button", {
      name: "Short rest",
      description: "Second Wind",
    }) as HTMLButtonElement
  ).disabled,
  long: (
    screen.getByRole("button", {
      name: "Long rest",
      description: "Everything",
    }) as HTMLButtonElement
  ).disabled,
});

// zooms the first unspent copy and spends it
export async function spend(card: string) {
  fireEvent.click(screen.getAllByRole("button", { name: `Zoom ${card}` })[0]);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Spend" }));
  await waitForElementToBeRemoved(() => screen.queryByRole("dialog"), { timeout: 3000 });
}

export const showCarousel = () => {
  localStorage.setItem("dnd-deck-designer:view-mode", "carousel");
};

// the play view opens on the carousel; most page tests exercise the grid mat
export const seedBrunhildeOnGrid = () => {
  localStorage.clear();
  localStorage.setItem("dnd-deck-designer:view-mode", "grid");
  characterStorage.save(brunhilde());
};
