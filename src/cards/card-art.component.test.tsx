import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CardArt } from "./card-art.component.tsx";

// alt="" makes the painting presentational: the card heading already names the card
const painting = () => screen.getByRole("presentation", { hidden: true });

test("paints public/art/<assetId>.png as a decorative image", () => {
  render(<CardArt assetId="fire-bolt" />);
  expect(painting().getAttribute("src")).toBe("/art/fire-bolt.png");
});

test("a JPEG draft is used when PNG artwork is absent", () => {
  render(<CardArt assetId="vex" />);
  fireEvent.error(painting());
  expect(painting().getAttribute("src")).toBe("/art/vex.jpg");
});

test("missing PNG and JPEG files remove the image without a broken glyph", () => {
  render(<CardArt assetId="not-painted-yet" />);
  fireEvent.error(painting());
  fireEvent.error(painting());
  expect(screen.queryByRole("presentation", { hidden: true })).toBeNull();
});

test("a different card starts with its own PNG lookup", () => {
  const view = render(<CardArt assetId="vex" />);
  fireEvent.error(painting());
  view.rerender(<CardArt assetId="fire-bolt" />);
  expect(painting().getAttribute("src")).toBe("/art/fire-bolt.png");
});
