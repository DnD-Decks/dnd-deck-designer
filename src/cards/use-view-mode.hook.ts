import { useState } from "react";
import { viewModeStorage } from "src/services/view-mode.storage";

export type ViewMode = "grid" | "carousel";

const read = () => {
  const saved = viewModeStorage.read();
  return saved === "grid" || saved === "carousel" ? saved : "carousel";
};

/** The deck view preference, remembered in localStorage. */
export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>(read);

  const choose = (next: ViewMode) => {
    viewModeStorage.write(next);
    setMode(next);
  };

  return { mode, choose };
}
