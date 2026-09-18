import { render, screen, within } from "@testing-library/react";
import { weaponMasteries } from "src/models/weapon-masteries/weapon-masteries.model";
import { expect, test } from "vitest";
import { WeaponMasteryCard } from "./weapon-mastery-card.component.tsx";

const byId = (id: string) => {
  const found = weaponMasteries.list().find((m) => m.id === id);
  if (!found) throw new Error(`fixture missing: ${id}`);
  return found;
};

test("card is an article labeled by the mastery name", () => {
  render(<WeaponMasteryCard mastery={byId("cleave")} />);
  screen.getByRole("article", { name: "Cleave" });
  screen.getByText("Weapon Mastery");
});

test("lists every weapon carrying the property, with its icon", () => {
  render(<WeaponMasteryCard mastery={byId("cleave")} />);
  const list = screen.getByRole("list", { name: "Weapons" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  within(list).getByRole("img", { name: "Greataxe" });
  within(list).getByRole("img", { name: "Halberd" });
});

test("weapons without a BG3 icon fall back to their name", () => {
  render(<WeaponMasteryCard mastery={byId("topple")} />);
  const list = screen.getByRole("list", { name: "Weapons" });
  within(list).getByText("Lance");
  expect(within(list).queryByRole("img", { name: "Lance" })).toBeNull();
  within(list).getByRole("img", { name: "Maul" });
});
