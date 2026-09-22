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

function liftScale(origin: DOMRect) {
  if (!origin.width || !origin.height) return 1; // unmeasured (jsdom) — hold it at rest size
  const byWidth = (window.innerWidth - EDGE_GAP * 2) / origin.width;
  const byHeight = (window.innerHeight - CONTROL_GAP * 2) / origin.height;
  return Math.max(1, Math.min(byWidth, byHeight, MAX_LIFT));
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

/** One card picked up off the mat and held under the lamp, the deck blurred out behind it. */
export function CardSpotlight({ label, liftedFrom, previous, next, onClose, children }: Props) {
  const stage = useRef<HTMLDialogElement>(null);
  const returning = useRef(false);
  const returnFocusTo = useRef(liftedFrom);
  const origin = useMemo(() => liftedFrom.getBoundingClientRect(), [liftedFrom]);
  const [scale, setScale] = useState(() => liftScale(origin));
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

  useEffect(() => {
    const fit = () => setScale(liftScale(origin));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [origin]);

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
