import actionsData from "../../data/actions/actions.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type ActionTiming = "action" | "bonus-action" | "reaction";

/** Action-economy glyphs shared by spell and class action cards (BG3 wiki icons, see public/icons/SOURCE.md). */
export const ACTION_TIMING_ICONS: Record<ActionTiming, string> = {
  action: "/icons/action.png",
  "bonus-action": "/icons/bonus-action.png",
  reaction: "/icons/reaction.png",
};

export const ACTION_TIMING_LABELS: Record<ActionTiming, string> = {
  action: "Action",
  "bonus-action": "Bonus Action",
  reaction: "Reaction",
};

export type CombatAction = {
  name: string;
  timing: ActionTiming;
  description: string;
};

const TABLE = lookup({
  items: actionsData.combat as CombatAction[],
  key: "name",
  label: "combat action",
});

export const combatActions = {
  get: ({ name }: { name: string }) => TABLE.get(name),
  find: ({ name }: { name: string }) => TABLE.find(name),
  list: TABLE.list,
};
