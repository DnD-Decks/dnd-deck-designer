import { render, screen, within } from "@testing-library/react";
import { weapons } from "src/models/gear/weapons.model";
import { describe, expect, test } from "vitest";
import { WeaponCard } from "./weapon-card.component.tsx";

const longsword = weapons.get({ id: "longsword" });
const longbow = weapons.get({ id: "longbow" });

describe("<WeaponCard />", () => {
  test("the card is an article labeled by the weapon name", () => {
    render(<WeaponCard weapon={longsword} />);
    screen.getByRole("article", { name: "Longsword" });
    screen.getByRole("heading", { name: "Longsword", level: 3 });
  });

  test("shows the visible facts: type, damage, properties and mastery", () => {
    render(<WeaponCard weapon={longsword} />);

    screen.getByText("Martial Melee Weapon");
    const damage = screen.getByRole("region", { name: "Damage" });
    within(damage).getByText("1d8");
    within(damage).getByText("slashing");
    const properties = screen.getByRole("list", { name: "Properties" });
    within(properties).getByText("Versatile (1d10)");
    const mastery = screen.getByRole("region", { name: "Weapon Mastery: Sap" });
    within(mastery).getByText(/disadvantage on its next attack roll/i);
  });

  test("a melee weapon leaves its range to the info line", () => {
    render(<WeaponCard weapon={longsword} />);

    expect(screen.queryByText("Melee")).toBeNull();
  });

  test("a ranged weapon shows its range and keeps the ammunition as a property", () => {
    render(<WeaponCard weapon={longbow} />);

    screen.getByText("150/600 ft");
    within(screen.getByRole("list", { name: "Properties" })).getByText("Ammunition (arrow)");
  });
});
