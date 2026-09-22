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

/** Room kept clear around a held card: the viewport edges, and the caption below it. */
const EDGE_GAP = 24;
const CONTROL_GAP = 72;
/** A card held in the hand, not a card filling the wall — the print layout stays legible. */
const MAX_LIFT = 2.6;
/** Mirrors the returning transition in card-spotlight.module.css. */
const RETURN_MS = 180;
/** How far the next card slides in from, before the lift scales it up. */
const DEAL_PX = 14;

/** How much bigger the card can be held without running out of viewport. */
function liftScale(origin: DOMRect) {
  if (!origin.width || !origin.height) return 1; // unmeasured (jsdom) — hold it at rest size
  const byWidth = (window.innerWidth - EDGE_GAP * 2) / origin.width;
  const byHeight = (window.innerHeight - CONTROL_GAP * 2) / origin.height;
  return Math.max(1, Math.min(byWidth, byHeight, MAX_LIFT));
}

/** The transform that puts the centred card back over the slot it was picked up from. */
function onTheMat(origin: DOMRect) {
  if (!origin.width) return "none";
  const dx = origin.left + origin.width / 2 - window.innerWidth / 2;
  const dy = origin.top + origin.height / 2 - window.innerHeight / 2;
  return `translate(${dx}px, ${dy}px)`;
}

/** A card one step away in the deck: named in the caption, reached with an arrow key. */
type Neighbour = { name: string; hold: () => void };

type Props = {
  /** Card name — names the dialog. */
  label: string;
  /** The control the card was picked up with: the lift travels out of it, and focus returns to it. */
  liftedFrom: HTMLElement;
  previous?: Neighbour;
  next?: Neighbour;
  onClose: () => void;
  children: ReactNode;
};

/**
 * One card picked up off the mat and held under the lamp: the deck blurs out behind it
 * and the card itself grows from the slot it was clicked in. Presentation only — the
 * caller decides which card is held and renders it as `children`.
 */
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
    window.setTimeout(onClose, RETURN_MS); // let the card settle back before it unmounts
  }, [onClose]);

  const deal = (direction: -1 | 1, neighbour: Neighbour) => {
    setDealt(direction);
    neighbour.hold();
  };

  // the card is mounted over its slot and travels to the centre on the first painted frame
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setPhase("held"));
    return () => cancelAnimationFrame(frame);
  }, []);

  // refit on resize, and whenever a neighbour takes its place — feat cards are landscape
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

    // the deck behind is inert; anything else that takes focus is bounced back in
    const keepFocusHere = (event: FocusEvent) => {
      if (!stage.current?.contains(event.target as Node)) stage.current?.focus();
    };
    document.addEventListener("focusin", keepFocusHere);

    return () => {
      document.removeEventListener("focusin", keepFocusHere);
      document.body.style.overflow = matOverflow;
      returnFocusTo.current.focus(); // back to whichever card ends up in the hand
    };
  }, []);

  return (
    // always-open, self-positioned dialog: showModal()'s top layer isn't needed — the stage
    // already covers the viewport, and focus, Escape and inertness are handled above.
    <dialog
      open
      ref={stage}
      // focus rests on the stage, so the arrows and Escape are heard wherever the pointer has been
      tabIndex={-1}
      className={styles.stage}
      data-phase={phase}
      aria-modal="true"
      aria-label={label}
      // the mat around the card is the dialog's own box — clicking it puts the card back
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
        if (event.key === "ArrowLeft" && previous) deal(-1, previous);
        if (event.key === "ArrowRight" && next) deal(1, next);
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

      {/* where you can go from here, and the way out */}
      <div className={styles.caption}>
        {previous ? (
          <button
            type="button"
            className={styles.step}
            data-step="previous"
            aria-label={`Previous card: ${previous.name}`}
            onClick={() => deal(-1, previous)}
          >
            <span aria-hidden="true">‹</span>
            <span className={styles.stepName}>{previous.name}</span>
          </button>
        ) : null}
        <button type="button" className={styles.dismiss} onClick={close}>
          Put it back
        </button>
        {next ? (
          <button
            type="button"
            className={styles.step}
            data-step="next"
            aria-label={`Next card: ${next.name}`}
            onClick={() => deal(1, next)}
          >
            <span className={styles.stepName}>{next.name}</span>
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
