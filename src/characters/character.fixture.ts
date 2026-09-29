import type { Character } from "src/characters/character.model";

export const brunhilde = (): Character => ({
  id: "f1",
  name: "Brünhilde",
  cls: "fighter",
  level: 1,
  picks: { weapons: ["longsword", "shortbow", "dagger"] },
});

export const elminster = (): Character => ({
  id: "w1",
  name: "Elminster",
  cls: "wizard",
  level: 1,
  picks: {},
});
