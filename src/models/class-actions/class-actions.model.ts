import barbarianActionsData from "../../data/class-actions/barbarian-class-actions.json" with {
  type: "json",
};
import bardActionsData from "../../data/class-actions/bard-class-actions.json" with {
  type: "json",
};
import fighterActionsData from "../../data/class-actions/fighter-class-actions.json" with {
  type: "json",
};
import paladinActionsData from "../../data/class-actions/paladin-class-actions.json" with {
  type: "json",
};
import rangerActionsData from "../../data/class-actions/ranger-class-actions.json" with {
  type: "json",
};
import sorcererActionsData from "../../data/class-actions/sorcerer-class-actions.json" with {
  type: "json",
};

import { lookup } from "../../lib/lookup.ts";

import type { ActionTiming } from "src/models/actions/combat.model";
import type { CharacterClass } from "src/models/class/classes.model";

/** What a class does with a resource: the resource card is the token, this card spends it. */
export type ClassAction = {
  id: string;
  name: string;
  /** `amount` defaults to 1; "X" is as many cards as the player chooses (Lay on Hands) */
  cost: { resource: string; amount?: number | "X" };
  timing: ActionTiming;
  range: string;
  duration: string;
  description: string;
};

const CLASS_DATA: Partial<Record<CharacterClass, ClassAction[]>> = {
  barbarian: barbarianActionsData as ClassAction[],
  bard: bardActionsData as ClassAction[],
  fighter: fighterActionsData as ClassAction[],
  paladin: paladinActionsData as ClassAction[],
  ranger: rangerActionsData as ClassAction[],
  sorcerer: sorcererActionsData as ClassAction[],
};

const TABLE = lookup({ items: Object.values(CLASS_DATA).flat(), key: "id", label: "class action" });

export const classActions = {
  findAll({ cls }: { cls: CharacterClass }) {
    return CLASS_DATA[cls] ?? [];
  },
  get: ({ id }: { id: string }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
