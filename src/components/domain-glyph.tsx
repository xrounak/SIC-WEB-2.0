/**
 * Line icons for each domain, drawn on a 32px grid with the current text colour.
 * Unknown slugs get a generic node.
 */
const PATHS: Record<string, string> = {
  // gear
  mechanical:
    "M16 10a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8",
  // truss bridge
  civil: "M3 24h26M5 24V14h22v10M5 14l5 10 5-10 5 10 5-10 2 4M10 24V14M15 24V14M20 24V14",
  // bolt
  electrical: "M18 3L7 18h8l-2 11 12-16h-8z",
  // chip
  electronics: "M10 10h12v12H10zM13 6v4M19 6v4M13 22v4M19 22v4M6 13h4M6 19h4M22 13h4M22 19h4M14 14h4v4h-4z",
  // robot arm
  robotics: "M5 27h12M11 27v-5M8 22h6l3-9M17 13l7-4M24 9l3 3M24 9l-1-4M17 13a2 2 0 1 0 0 .1",
  // signal
  iot: "M16 24a1.5 1.5 0 1 0 0 .1M11 19a7 7 0 0 1 10 0M7 15a12.5 12.5 0 0 1 18 0M3.5 11a17.5 17.5 0 0 1 25 0",
  // network
  "ai-ml":
    "M6 9a2 2 0 1 0 0 .1M6 23a2 2 0 1 0 0 .1M16 6a2 2 0 1 0 0 .1M16 16a2 2 0 1 0 0 .1M16 26a2 2 0 1 0 0 .1M26 16a2 2 0 1 0 0 .1M8 9l6-3M8 9l6 7M8 23l6-7M8 23l6 3M18 6l6 10M18 16h6M18 26l6-10",
  // code
  software: "M11 9l-7 7 7 7M21 9l7 7-7 7M18 6l-4 20",
  // flask
  research: "M12 4h8M13 4v8L6 25a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3l-7-13V4M9 20h14",
};

export function DomainGlyph({ slug, size = 32, className }: { slug: string; size?: number; className?: string }) {
  const d = PATHS[slug] ?? "M16 12a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM16 4v8M16 20v8M4 16h8M20 16h8";
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
