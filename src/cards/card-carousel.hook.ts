import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";

const clamp = (index: number, length: number) => Math.max(0, Math.min(index, length - 1));

// scroll the container, never scrollIntoView: that one drags the page with it.
// instant, or a second jump during a smooth scroll makes mandatory snap pull
// the track back to the old slide; jsdom has no layout at all
export const centre = (container: HTMLElement | null, child: Element | undefined) => {
  if (!container || !child || typeof container.scrollTo !== "function") return;
  const box = container.getBoundingClientRect();
  const item = child.getBoundingClientRect();
  container.scrollTo({
    left: container.scrollLeft + item.left - box.left - (box.width - item.width) / 2,
    behavior: "instant",
  });
};

/** where the carousel sits: the centred slide, plus the handlers that move it */
export function useCarouselPosition({ length }: { length: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [position, setPosition] = useState(0);

  // callers reset the carousel with a `key` change; the clamp keeps a shrinking
  // deck from pointing past its last card in the meantime
  const index = clamp(position, length);

  // stable so memoised thumbnails keep their onSelect across internal re-renders
  const goTo = useCallback(
    (i: number) => {
      const next = clamp(i, length);
      indexRef.current = next;
      setPosition(next);
      centre(trackRef.current, trackRef.current?.children[next]);
    },
    [length]
  );

  // the index follows the swipe: read the scroll position, keep it in the ref,
  // and only re-render when the centred slide actually changes
  const followScroll = () => {
    const track = trackRef.current;
    const slide = track?.children[0];
    if (!track || !slide) return;
    const width = slide.getBoundingClientRect().width;
    if (!width) return;
    const i = clamp(Math.round(track.scrollLeft / width), length);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setPosition(i);
    }
  };

  const step = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(indexRef.current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(indexRef.current + 1);
    }
  };

  return { index, goTo, trackRef, followScroll, step };
}
