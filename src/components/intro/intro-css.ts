/**
 * Intro loader styles, shipped inline with the component (not in globals.css) so the
 * full-screen cover can never render half-styled if the stylesheet is stale or late.
 */
export const INTRO_CSS = `.intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  color: var(--color-text);
  background: radial-gradient(ellipse 70% 60% at 50% 46%, color-mix(in oklab, var(--color-primary) 16%, var(--color-bg)), var(--color-bg) 72%);
  clip-path: circle(150% at 50% 50%);
  /* If scripts never run, the cover lets go by itself. */
  animation: intro-failsafe 0s 14s forwards;
}
html[data-intro="done"] .intro {
  display: none;
}
html:not([data-intro="done"]) body {
  overflow: hidden;
}
.intro-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.intro-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 42%, rgb(0 0 0 / 0.7));
}
.intro-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.45;
  background: repeating-linear-gradient(0deg, transparent 0 2px, rgb(0 0 0 / 0.22) 2px 3px);
}
.intro-corner {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  border: 0 solid var(--color-primary);
  opacity: 0.8;
}
.intro-corner.is-tl { top: 1rem; left: 1rem; border-width: 2px 0 0 2px; }
.intro-corner.is-tr { top: 1rem; right: 1rem; border-width: 2px 2px 0 0; }
.intro-corner.is-bl { bottom: 1rem; left: 1rem; border-width: 0 0 2px 2px; }
.intro-corner.is-br { bottom: 1rem; right: 1rem; border-width: 0 2px 2px 0; }
.intro-tag {
  position: absolute;
  top: 1.25rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
.intro-tag.is-l { left: 3.25rem; }
.intro-tag.is-r { right: 3.25rem; text-align: right; }
@media (max-width: 520px) {
  .intro-tag.is-r { display: none; }
}
.intro-logo {
  position: absolute;
  left: 50%;
  top: 46%;
  width: min(46vmin, 22rem);
  aspect-ratio: 1;
  translate: -50% -50%;
  opacity: 0;
  filter: drop-shadow(0 0 2.2rem color-mix(in oklab, var(--color-primary) 55%, transparent));
}
.intro.is-fallback .intro-logo {
  opacity: 1;
  animation: intro-pulse 1.6s ease-in-out infinite alternate;
}
.intro-bottom {
  position: absolute;
  left: 50%;
  bottom: max(2.25rem, 7vh);
  translate: -50% 0;
  display: grid;
  width: min(24rem, 78vw);
  gap: 0.6rem;
  justify-items: center;
}
.intro-readout {
  display: flex;
  width: 100%;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text);
}
.intro-bar {
  width: 100%;
  height: 6px;
  background: color-mix(in oklab, var(--color-border) 80%, transparent);
  clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
}
.intro-bar i {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 0 12px var(--color-primary);
}
.intro-skip {
  margin-top: 0.4rem;
  padding: 0.35rem 0.7rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  transition: color 0.2s;
}
.intro-skip:hover,
.intro-skip:focus-visible {
  color: var(--color-primary);
}
.intro-flash {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 46%, #fff, color-mix(in oklab, var(--color-primary) 70%, #fff) 45%, transparent 75%);
}
.intro.is-leaving {
  transition: clip-path 0.85s cubic-bezier(0.7, 0, 0.3, 1);
  clip-path: circle(0% at 50% 50%);
}
@keyframes intro-failsafe {
to {
  visibility: hidden;
  pointer-events: none;
}
}
@keyframes intro-pulse {
from { transform: scale(0.96); }
to { transform: scale(1.03); }
}
.intro-gate {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  display: none;
  translate: -50% -50%;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem 2.2rem;
  font-size: 0.95rem;
  color: var(--color-on-primary);
  background: var(--color-primary);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  cursor: pointer;
  animation: intro-gate-pulse 1.4s ease-in-out infinite alternate;
}
.intro-gate small {
  font-size: 0.6875rem;
  letter-spacing: 0.3em;
  opacity: 0.75;
}
.intro.is-gated .intro-gate {
  display: flex;
}
.intro.is-gated .intro-bottom > :not(.intro-skip) {
  visibility: hidden;
}
.intro.is-gated .intro-logo {
  opacity: 0.18;
}
@keyframes intro-gate-pulse {
  from { filter: drop-shadow(0 0 0.4rem var(--color-primary)); }
  to { filter: drop-shadow(0 0 1.4rem var(--color-primary)); }
}
`;
