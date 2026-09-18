import { render, screen } from "@testing-library/react";
import { feats } from "src/models/feats/feats.model";
import { expect, test } from "vitest";
import { FeatCard } from "./feat-card.component.tsx";

const arcaneRecovery = feats
  .findAll({ cls: "wizard" })
  .find((f) => f.id === "wizard-arcane-recovery");
if (!arcaneRecovery) throw new Error("fixture missing: wizard-arcane-recovery");

test("card is an article labeled by the feat name only (badge is decorative)", () => {
  render(<FeatCard feat={arcaneRecovery} />);
  screen.getByRole("article", { name: "Arcane Recovery" });
  screen.getByRole("heading", { name: "Arcane Recovery", level: 3 });
  // decorative badge: alt="" keeps it out of the accessibility tree
  expect(screen.queryByRole("img")).toBeNull();
});

test("class badge is painted from the feat's icon", () => {
  const { container } = render(<FeatCard feat={arcaneRecovery} />);
  const badge = container.querySelector("img[aria-hidden='true']");
  expect(badge?.getAttribute("src")).toBe("/icons/class-wizard.png");
});

test("source and description are rendered", () => {
  render(<FeatCard feat={arcaneRecovery} />);
  screen.getByText("Wizard Level 1");
  screen.getByText(arcaneRecovery.description.slice(0, 20), { exact: false });
});
