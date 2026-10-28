"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Pinned horizontal journey: while the visitor scrolls down (mouse wheel, trackpad
 * or touch), the section stays in place and its track slides sideways. The
 * section's height is set so the vertical distance equals the horizontal travel.
 * One passive scroll listener and one transform per frame. Under reduced motion
 * it falls back to an ordinary swipeable row.
 */
export function HorizontalScroller({ children, label }: { children: ReactNode; label: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let travel = 0;
    let frame = 0;

    const measure = () => {
      travel = Math.max(track.scrollWidth - window.innerWidth, 0);
      setHeight(travel + window.innerHeight);
      setPinned(true);
      update();
    };
    const update = () => {
      frame = 0;
      const top = section.getBoundingClientRect().top;
      const progress = travel ? Math.min(Math.max(-top / travel, 0), 1) : 0;
      track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} aria-label={label} className="relative" style={pinned ? { height } : undefined}>
      <div className={pinned ? "sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden" : "overflow-x-auto"}>
        <div ref={trackRef} className="flex w-max gap-4 px-4 py-6 will-change-transform sm:gap-6 sm:px-[8vw]">
          {children}
        </div>
        {pinned && (
          <div className="mx-auto mt-6 h-px w-[min(84vw,75rem)] bg-line" aria-hidden="true">
            <span ref={barRef} className="block h-px origin-left scale-x-0 bg-primary" />
          </div>
        )}
      </div>
    </section>
  );
}
