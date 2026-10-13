import { useRef } from "react";

/** One element per key: `ref(key)` registers it, `get(key)` reads it back. */
export function useRefMap<T extends HTMLElement>() {
  const elements = useRef(new Map<string, T>());

  const ref = (key: string) => (element: T | null) => {
    if (element) elements.current.set(key, element);
    return () => {
      elements.current.delete(key);
    };
  };

  const get = (key: string) => elements.current.get(key);

  return { ref, get };
}
