import { useState } from "react";

export function useCardSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = (key: string) =>
    setSelected((now) => {
      const next = new Set(now);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return { selected, toggle };
}
