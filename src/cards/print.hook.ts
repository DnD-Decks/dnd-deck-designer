import { useEffect, useState } from "react";

/** true while the browser is printing — lets a view swap to a print-safe layout */
export function usePrinting() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const on = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
    };
  }, []);

  return printing;
}
