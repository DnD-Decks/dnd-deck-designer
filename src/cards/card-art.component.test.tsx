import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CardArt } from "./card-art.component.tsx";

// alt="" makes the painting presentational: the card heading already names the card
const painting = () => screen.getByRole("presentation", { hidden: true });

test("paints public/art/<assetId>.png as a decorative image", () => {
  render(<CardArt assetId="fire-bolt" />);
  expect(painting().getAttribute("src")).toBe("/art/fire-bolt.png");
});

test("a missing file removes the image instead of showing a broken glyph", () => {
  render(<CardArt assetId="not-painted-yet" />);
  fireEvent.error(painting());
  expect(screen.queryByRole("presentation", { hidden: true })).toBeNull();
});
