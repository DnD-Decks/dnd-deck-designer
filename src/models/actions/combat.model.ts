export type ActionTiming = "action" | "bonus-action" | "reaction";

/** Action-economy glyphs shared by spell and resource cards (BG3 wiki icons, see public/icons/SOURCE.md). */
export const ACTION_TIMING_ICONS: Record<ActionTiming, string> = {
  action: "/icons/action.png",
  "bonus-action": "/icons/bonus-action.png",
  reaction: "/icons/reaction.png",
};
