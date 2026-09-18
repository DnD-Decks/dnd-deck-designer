import actionsData from "../../data/actions/actions.json" with { type: "json" };

export type ActionTiming = "action" | "bonus-action" | "reaction";

/** Action-economy glyphs shared by spell and resource cards (BG3 wiki icons, see public/icons/SOURCE.md). */
export const ACTION_TIMING_ICONS: Record<ActionTiming, string> = {
  action: "/icons/action.png",
  "bonus-action": "/icons/bonus-action.png",
  reaction: "/icons/reaction.png",
};

export type CombatAction = {
  name: string;
  timing: ActionTiming;
  description: string;
};

const DATA = actionsData.combat as CombatAction[];
const BY_NAME = new Map(DATA.map((a) => [a.name, a]));

export const combatActions = {
  get({ name }: { name: string }): CombatAction {
    const found = BY_NAME.get(name);
    if (!found) throw new Error(`Unknown combat action: ${name}`);
    return found;
  },

  find({ name }: { name: string }): CombatAction | undefined {
    return BY_NAME.get(name);
  },

  list(): CombatAction[] {
    return DATA;
  },
};
