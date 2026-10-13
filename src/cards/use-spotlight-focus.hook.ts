import type { RefObject } from "react";
import { useEffect, useRef } from "react";

export function useSpotlightFocus({
  stage,
  liftedFrom,
}: { stage: RefObject<HTMLElement | null>; liftedFrom: HTMLElement }) {
  const returnFocusTo = useRef(liftedFrom);

  useEffect(() => {
    returnFocusTo.current = liftedFrom;
  }, [liftedFrom]);

  useEffect(() => {
    const matOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stage.current?.focus();

    const keepFocusHere = (event: FocusEvent) => {
      if (!stage.current?.contains(event.target as Node)) stage.current?.focus();
    };
    document.addEventListener("focusin", keepFocusHere);

    return () => {
      document.removeEventListener("focusin", keepFocusHere);
      document.body.style.overflow = matOverflow;
      returnFocusTo.current.focus();
    };
  }, [stage]);
}
