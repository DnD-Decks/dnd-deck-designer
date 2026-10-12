import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const EDGE_GAP = 24;
const CONTROL_GAP = 72;
const MAX_LIFT = 2.6;

function liftScale({ width, height }: { width: number; height: number }) {
  if (!width || !height) return 1; // unmeasured (jsdom) — hold it at rest size
  const byWidth = (window.innerWidth - EDGE_GAP * 2) / width;
  const byHeight = (window.innerHeight - CONTROL_GAP * 2) / height;
  return Math.min(byWidth, byHeight, MAX_LIFT);
}

export function useLiftScale(card: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  // The trigger may be a small preview button, not a card. Fit the card itself,
  // including after stepping to a card with a different size.
  const fit = useCallback(() => {
    const width = card.current?.offsetWidth ?? 0;
    const height = card.current?.offsetHeight ?? 0;
    const fittedScale = liftScale({ width, height });
    setScale(fittedScale);
  }, [card]);
  useLayoutEffect(fit);

  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return scale;
}
