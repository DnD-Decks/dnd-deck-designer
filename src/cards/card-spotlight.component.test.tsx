import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { CardSpotlight } from "./card-spotlight.component.tsx";

function trigger() {
  const button = document.createElement("button");
  button.textContent = "Zoom Fire Bolt";
  document.body.append(button);
  return button;
}

afterEach(() => {
  for (const button of document.body.querySelectorAll(":scope > button")) button.remove();
});

function renderSpotlight({ onClose = vi.fn(), liftedFrom = trigger() } = {}) {
  const view = render(
    <CardSpotlight label="Fire Bolt" liftedFrom={liftedFrom} onClose={onClose}>
      <article aria-label="Fire Bolt">held card</article>
    </CardSpotlight>
  );
  return { ...view, onClose, liftedFrom };
}

test("the held card sits in a modal dialog named after it", () => {
  renderSpotlight();
  const dialog = screen.getByRole("dialog", { name: "Fire Bolt" });
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(dialog.textContent).toContain("held card");
});

test("focus moves into the spotlight", () => {
  renderSpotlight();
  expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "Fire Bolt" }));
});

test("'Put it back' returns the card", async () => {
  const { onClose } = renderSpotlight();
  fireEvent.click(screen.getByRole("button", { name: "Put it back" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

test("Escape returns the card", async () => {
  const { onClose } = renderSpotlight();
  fireEvent.keyDown(screen.getByRole("dialog", { name: "Fire Bolt" }), { key: "Escape" });
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

test("clicking the mat around the card returns it", async () => {
  const { onClose } = renderSpotlight();
  fireEvent.click(screen.getByRole("dialog", { name: "Fire Bolt" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

test("the card in the row takes focus back, and the page scrolls again", () => {
  const { unmount, liftedFrom } = renderSpotlight();
  expect(document.body.style.overflow).toBe("hidden");

  unmount();
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(liftedFrom);
});
