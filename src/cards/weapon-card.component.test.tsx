import { render, screen, within } from "@testing-library/react";
import { weapons } from "src/models/gear/weapons.model";
import { test } from "vitest";
import { WeaponCard } from "./weapon-card.component.tsx";

const longsword = weapons.get({ id: "longsword" });
const longbow = weapons.get({ id: "longbow" });

test("card is an article labeled by the weapon name", () => {
  render(<WeaponCard weapon={longsword} />);
  screen.getByRole("article", { name: "Longsword" });
  screen.getByText("Martial Melee Weapon");
});

test("shows damage and properties with their details", () => {
  render(<WeaponCard weapon={longsword} />);
  screen.getByText("1d8 slashing");
  const properties = screen.getByRole("list", { name: "Properties" });
  within(properties).getByText("Versatile (1d10)");
});

test("carries the text of its mastery property", () => {
  render(<WeaponCard weapon={longsword} />);
  const mastery = screen.getByRole("region", { name: "Weapon Mastery: Sap" });
  within(mastery).getByText(/disadvantage on its next attack roll/i);
});

test("a ranged weapon shows its range and keeps the ammunition as a property", () => {
  render(<WeaponCard weapon={longbow} />);
  screen.getByText("150/600 ft");
  within(screen.getByRole("list", { name: "Properties" })).getByText("Ammunition (arrow)");
});
