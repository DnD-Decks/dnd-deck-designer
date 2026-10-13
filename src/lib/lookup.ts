// keys must be strings: `find` takes any string (a route param, a stored id) and just misses on unknown ones
export function lookup<K extends string, T extends Record<K, string>>({
  items,
  key,
  label,
}: { items: readonly T[]; key: K; label: string }) {
  const byKey = new Map<string, T>(items.map((item) => [item[key], item]));

  return {
    get(value: T[K]) {
      const found = byKey.get(value);
      if (!found) throw new Error(`Unknown ${label}: ${value}`);
      return found;
    },
    find: (value: string) => byKey.get(value),
    list: () => items,
  };
}
