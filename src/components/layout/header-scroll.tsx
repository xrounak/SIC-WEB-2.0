"use client";

import { useEffect } from "react";

/** Marks <html data-scrolled> once the page leaves the top, so the header can solidify. */
export function HeaderScrollState() {
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      frame = 0;
      document.documentElement.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
