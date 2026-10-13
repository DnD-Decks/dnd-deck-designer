import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLiftScale } from "src/cards/use-lift-scale.hook";
import { useSpotlightFocus } from "src/cards/use-spotlight-focus.hook";
import { useSpotlightPhase } from "src/cards/use-spotlight-phase.hook";
import styles from "./card-spotlight.module.css";

const DEAL_PX = 14;

function onTheMat(origin: DOMRect) {
  if (!origin.width) return "none"; // unmeasured (jsdom)
  const dx = origin.left + origin.width / 2 - window.innerWidth / 2;
  const dy = origin.top + origin.height / 2 - window.innerHeight / 2;
  return `translate(${dx}px, ${dy}px)`;
}

type Neighbour = { name: string; hold: () => void };

/** puts the card back, then runs `then` once it has landed */
export type PutBack = (then?: () => void) => void;

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
  actions?: (putBack: PutBack) => ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export function CardSpotlight({
  label,
  liftedFrom,
  previous,
  next,
  actions,
  onClose,
  children,
}: Props) {
  const stage = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const origin = useMemo(() => liftedFrom.getBoundingClientRect(), [liftedFrom]);
  const [dealt, setDealt] = useState(0);
  const { phase, close } = useSpotlightPhase(onClose);
  const scale = useLiftScale(card);
  useSpotlightFocus({ stage, liftedFrom });

  const deal = (direction: -1 | 1) => {
    const neighbour = direction === -1 ? previous : next;
    if (!neighbour) return;
    setDealt(direction);
    neighbour.hold();
  };

  const closeOnMat = (event: MouseEvent) => {
    if (event.target === event.currentTarget) close();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") deal(-1);
    if (event.key === "ArrowRight") deal(1);
  };

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
      onClick={closeOnMat}
      onKeyDown={onKey}
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
        <div className={styles.hands}>
          {actions?.(close)}
          <button type="button" className={styles.dismiss} onClick={() => close()}>
            Put it back
          </button>
        </div>
        {next && <Step direction="next" name={next.name} onStep={() => deal(1)} />}
      </div>
    </dialog>
  );
}
