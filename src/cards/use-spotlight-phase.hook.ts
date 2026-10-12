import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { PutBack } from "src/cards/card-spotlight.component";

/** Mirrors the returning transition in card-spotlight.module.css. */
const RETURN_MS = 180;

export function useSpotlightPhase(onClose: () => void) {
  const returning = useRef(false);
  const [phase, setPhase] = useState<"entering" | "held" | "returning">("entering");

  const close = useCallback<PutBack>(
    (then) => {
      if (returning.current) return;
      returning.current = true;
      setPhase("returning");
      window.setTimeout(() => {
        onClose();
        then?.();
      }, RETURN_MS);
    },
    [onClose]
  );

  // the travel needs one painted frame at the origin before it can transition away from it
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setPhase("held"));
    return () => cancelAnimationFrame(frame);
  }, []);

  return { phase, close };
}
