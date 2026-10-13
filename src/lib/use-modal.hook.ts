import type { RefObject } from "react";
import { useEffect } from "react";

// what showModal() would do: everything but the dialog goes inert, Escape cancels from anywhere
export function useModal({
  scrim,
  onCancel,
}: { scrim: RefObject<HTMLElement | null>; onCancel: () => void }) {
  useEffect(() => {
    const behind = [...document.body.children].filter((element) => element !== scrim.current);
    for (const element of behind) element.setAttribute("inert", "");
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", cancelOnEscape);

    return () => {
      document.removeEventListener("keydown", cancelOnEscape);
      for (const element of behind) element.removeAttribute("inert");
    };
  }, [scrim, onCancel]);
}
