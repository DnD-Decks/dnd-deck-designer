import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";

const STEPS: Partial<Record<string, -1 | 1>> = { ArrowLeft: -1, ArrowRight: 1 };

const clamp = ({ index, length }: { index: number; length: number }) =>
  Math.max(0, Math.min(index, length - 1));

// scroll the container, never scrollIntoView: that one drags the page with it.
// instant, or a second jump during a smooth scroll makes mandatory snap pull
// the track back to the old slide; jsdom has no layout at all
export const centre = ({ container, index }: { container: HTMLElement | null; index: number }) => {
  const child = container?.children[index];
  if (!container || !child || typeof container.scrollTo !== "function") return;
  const box = container.getBoundingClientRect();
  const item = child.getBoundingClientRect();
  container.scrollTo({
    left: container.scrollLeft + item.left - box.left - (box.width - item.width) / 2,
    behavior: "instant",
  });
};

export function useCarouselPosition({ length }: { length: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [position, setPosition] = useState(0);

  // callers reset the carousel with a `key` change; the clamp keeps a shrinking
  // deck from pointing past its last card in the meantime
  const index = clamp({ index: position, length });

  // stable so memoised thumbnails keep their onSelect across internal re-renders
  const goTo = useCallback(
    (i: number) => {
      const next = clamp({ index: i, length });
      indexRef.current = next;
      setPosition(next);
      centre({ container: trackRef.current, index: next });
    },
    [length]
  );

  // the index follows the swipe: read the scroll position, keep it in the ref,
  // and only re-render when the centred slide actually changes
  const followScroll = () => {
    const track = trackRef.current;
    const width = track?.children[0]?.getBoundingClientRect().width;
    if (!track || !width) return;
    const i = clamp({ index: Math.round(track.scrollLeft / width), length });
    if (i === indexRef.current) return;
    indexRef.current = i;
    setPosition(i);
  };

  const step = (event: KeyboardEvent) => {
    const delta = STEPS[event.key];
    if (!delta) return;
    event.preventDefault();
    goTo(indexRef.current + delta);
  };

  return { index, goTo, trackRef, followScroll, step };
}
