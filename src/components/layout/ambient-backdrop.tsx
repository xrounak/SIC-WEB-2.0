import { AmbientField } from "./ambient-field";

/**
 * Blurred light drifting behind every page, so the background feels alive, with the
 * circuit field (ambient-field.tsx) on top: always moving, and reacting to scroll.
 * Colours come from the active theme's tokens. Each blob is blurred once and then
 * only moved (transform), so it costs very little per frame. Static under
 * reduced motion; paused while the tab is hidden.
 */
export function AmbientBackdrop() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient-blob ambient-a" />
      <span className="ambient-blob ambient-b" />
      <span className="ambient-blob ambient-c" />
      <span className="ambient-sweep" />
      <AmbientField />
    </div>
  );
}
