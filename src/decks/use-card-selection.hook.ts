import { useState } from "react";

export function useCardSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = (key: string) =>
    setSelected((now) => {
      const next = new Set(now);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  return { selected, toggle };
}
