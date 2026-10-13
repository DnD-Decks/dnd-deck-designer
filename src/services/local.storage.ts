// localStorage throws in private mode, with site data blocked, or over quota
export const localStore = {
  read(key: string) {
    try {
      return localStorage.getItem(key) ?? undefined;
    } catch {
      return undefined;
    }
  },

  write({ key, value }: { key: string; value: string }) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};
