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
