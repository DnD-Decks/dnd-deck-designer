/**
 * The `get` / `find` / `list` trio every model exposes, over static data keyed by one field.
 * - `lookup({ items: ARMOR, key: "id", label: "armor" }).get("shield")` is the shield
 * - `.find("mithral-plate")` is undefined
 *
 * `get` throws on an unknown key: `Unknown armor: mithral-plate`.
 */
export function lookup<T, K extends keyof T>({
  items,
  key,
  label,
}: { items: readonly T[]; key: K; label: string }) {
  const byKey = new Map<unknown, T>(items.map((item) => [item[key], item]));

  return {
    get(value: T[K]) {
      const found = byKey.get(value);
      if (!found) throw new Error(`Unknown ${label}: ${String(value)}`);
      return found;
    },
    find: (value: string) => byKey.get(value),
    list: () => items,
  };
}
