import { usePrinting } from "src/cards/use-printing.hook";
import { useViewMode } from "src/cards/use-view-mode.hook";

export function useDeckLayout() {
  const { mode, choose } = useViewMode();
  const printing = usePrinting();
  const carousel = mode === "carousel" && !printing;
  return { mode, choose, carousel };
}
