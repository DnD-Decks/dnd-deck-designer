import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./card-spotlight.module.css";

const EDGE_GAP = 24;
const CONTROL_GAP = 72;
const MAX_LIFT = 2.6;
/** Mirrors the returning transition in card-spotlight.module.css. */
const RETURN_MS = 180;
const DEAL_PX = 14;

function liftScale({ width, height }: { width: number; height: number }) {
  if (!width || !height) return 1; // unmeasured (jsdom) — hold it at rest size
  const byWidth = (window.innerWidth - EDGE_GAP * 2) / width;
  const byHeight = (window.innerHeight - CONTROL_GAP * 2) / height;
  return Math.min(byWidth, byHeight, MAX_LIFT);
}

function onTheMat(origin: DOMRect) {
  if (!origin.width) return "none"; // unmeasured (jsdom)
  const dx = origin.left + origin.width / 2 - window.innerWidth / 2;
  const dy = origin.top + origin.height / 2 - window.innerHeight / 2;
  return `translate(${dx}px, ${dy}px)`;
}

type Neighbour = { name: string; hold: () => void };

type StepProps = {
  direction: "previous" | "next";
  name: string;
  onStep: () => void;
};

/** A neighbour named in the caption; its chevron is drawn in CSS. */
function Step({ direction, name, onStep }: StepProps) {
  return (
    <button
      type="button"
      className={styles.step}
      data-step={direction}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} card: ${name}`}
      onClick={onStep}
    >
      {name}
    </button>
  );
}

type Props = {
  label: string;
  liftedFrom: HTMLElement;
  previous?: Neighbour;
  next?: Neighbour;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Previews a card and returns focus to its trigger on dismissal.
 * - Fits the card to the viewport.
 * - Supports stepping when neighbours are supplied.
 * Throws on no expected input.
 */
export function CardSpotlight({ label, liftedFrom, previous, next, onClose, children }: Props) {
  const stage = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const returning = useRef(false);
  const returnFocusTo = useRef(liftedFrom);
  const origin = useMemo(() => liftedFrom.getBoundingClientRect(), [liftedFrom]);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<"entering" | "held" | "returning">("entering");
  const [dealt, setDealt] = useState(0);

  const close = useCallback(() => {
    if (returning.current) return;
    returning.current = true;
    setPhase("returning");
    window.setTimeout(onClose, RETURN_MS);
  }, [onClose]);

  const deal = (direction: -1 | 1) => {
    const neighbour = direction === -1 ? previous : next;
    if (!neighbour) return;
    setDealt(direction);
    neighbour.hold();
  };

  // the travel needs one painted frame at the origin before it can transition away from it
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setPhase("held"));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The trigger may be a small preview button, not a card. Fit the card itself,
  // including after stepping to a card with a different size.
  const fit = useCallback(() => {
    const width = card.current?.offsetWidth ?? 0;
    const height = card.current?.offsetHeight ?? 0;
    const fittedScale = liftScale({ width, height });
    setScale(fittedScale);
  }, []);
  useLayoutEffect(fit);

  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  useEffect(() => {
    returnFocusTo.current = liftedFrom;
  }, [liftedFrom]);

  // layout, not passive: a passive cleanup runs after the dialog leaves the DOM, so focus would drop to <body> in between
  useLayoutEffect(() => {
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
  }, []);

  return (
    // open, not showModal(): the stage covers the viewport itself, and jsdom 26 has no showModal
    <dialog
      open
      ref={stage}
      // focus rests here, so the arrows and Escape are heard wherever the pointer has been
      tabIndex={-1}
      className={styles.stage}
      data-phase={phase}
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
        if (event.key === "ArrowLeft") deal(-1);
        if (event.key === "ArrowRight") deal(1);
      }}
    >
      <div
        className={styles.lift}
        style={{ transform: phase === "held" ? `scale(${scale})` : onTheMat(origin) }}
      >
        <div
          key={label}
          ref={card}
          className={styles.held}
          data-deal={dealt || undefined}
          style={{ "--deal-from": `${dealt * DEAL_PX}px` } as CSSProperties}
        >
          {children}
        </div>
      </div>

      <div className={styles.caption}>
        {previous && <Step direction="previous" name={previous.name} onStep={() => deal(-1)} />}
        <button type="button" className={styles.dismiss} onClick={close}>
          Put it back
        </button>
        {next && <Step direction="next" name={next.name} onStep={() => deal(1)} />}
      </div>
    </dialog>
  );
}
