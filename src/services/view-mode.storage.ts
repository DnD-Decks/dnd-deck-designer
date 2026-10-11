const VIEW_MODE_KEY = "dnd-deck-designer:view-mode";

// localStorage throws in private mode, with site data blocked, or over quota —
// losing the chosen view is a nicety, not an error
export const viewModeStorage = {
  read() {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  },

  write(mode: string) {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  },
};
