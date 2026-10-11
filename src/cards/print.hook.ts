import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/** true while the browser is printing — lets a view swap to a print-safe layout */
export function usePrinting() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    // flushSync: the print-safe layout must be in the DOM when beforeprint returns
    const on = () => flushSync(() => setPrinting(true));
    const off = () => flushSync(() => setPrinting(false));
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
    };
  }, []);

  return printing;
}
