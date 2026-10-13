import { localStore } from "src/services/local.storage";

const VIEW_MODE_KEY = "dnd-deck-designer:view-mode";

// losing the chosen view is a nicety, not an error
export const viewModeStorage = {
  read() {
    return localStore.read(VIEW_MODE_KEY);
  },

  write(mode: string) {
    localStore.write({ key: VIEW_MODE_KEY, value: mode });
  },
};
