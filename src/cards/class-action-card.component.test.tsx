import { render, screen, within } from "@testing-library/react";
import { classActions } from "src/models/class-actions/class-actions.model";
import { describe, expect, test } from "vitest";
import { ClassActionCard } from "./class-action-card.component.tsx";

const actionOf = (id: string) => classActions.get({ id });

const costNames = () =>
  within(screen.getByRole("region", { name: "Cost" }))
    .getAllByRole("img")
    .map((img) => img.getAttribute("alt"));

describe("<ClassActionCard />", () => {
  test("the card is an article labeled by the action name", () => {
    render(<ClassActionCard action={actionOf("fighter-second-wind")} />);
    screen.getByRole("article", { name: "Second Wind" });
  });

  test("the cost rail shows the timing and the resource it spends", () => {
    render(<ClassActionCard action={actionOf("fighter-second-wind")} />);
    expect(costNames()).toEqual(["Bonus Action", "Second Wind"]);
    expect(screen.queryByText(/^×/)).toBeNull();
  });

  test("an open amount reads ×X under the resource", () => {
    render(<ClassActionCard action={actionOf("paladin-lay-on-hands")} />);
    expect(costNames()).toEqual(["Bonus Action", "Lay on Hands"]);
    screen.getByText("×X");
  });

  test("range and duration sit on the info line and the footer", () => {
    render(<ClassActionCard action={actionOf("paladin-lay-on-hands")} />);
    screen.getByText("Touch");
    screen.getByText("Instantaneous");
  });
});
