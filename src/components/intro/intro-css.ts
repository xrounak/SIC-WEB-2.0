/**
 * Intro loader styles, shipped inline with the component (not in globals.css) so the
 * full-screen cover can never render half-styled if the stylesheet is stale or late.
 *
 * Layout: the particle shapes sit in a box at 44% height, min(60svh, 80vw) wide (the
 * scene frames them there). The title decodes under the SIC wordmark, and the
 * progress readout fades out at the lock so the two never collide.
 */
export const INTRO_CSS = `.intro {
  --seal: min(60svh, 80vw);
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  color: var(--color-text);
  background:
    radial-gradient(ellipse 60% 50% at 50% 44%, color-mix(in oklab, var(--color-primary) 14%, #05070b), #05070b 70%),
    #05070b;
  clip-path: circle(150% at 50% 50%);
  /* If scripts never run, the cover lets go by itself. */
  animation: intro-failsafe 0s 16s forwards;
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
/* Impact: a split-second RGB split and jolt */
.intro-canvas.is-hit {
  animation: intro-hit 0.42s steps(6) 1;
}
@keyframes intro-hit {
  0% { filter: drop-shadow(6px 0 0 rgb(255 40 90 / 0.75)) drop-shadow(-6px 0 0 rgb(40 200 255 / 0.75)); translate: 4px -2px; }
  35% { filter: drop-shadow(-4px 0 0 rgb(255 40 90 / 0.6)) drop-shadow(4px 0 0 rgb(40 200 255 / 0.6)); translate: -3px 2px; }
  70% { filter: drop-shadow(2px 0 0 rgb(255 40 90 / 0.4)) drop-shadow(-2px 0 0 rgb(40 200 255 / 0.4)); translate: 1px 0; }
  100% { filter: none; translate: 0 0; }
}
/* A faint perspective grid on the floor, drifting towards you */
.intro-grid {
  position: absolute;
  left: -50%;
  right: -50%;
  bottom: -10%;
  height: 55%;
  pointer-events: none;
  opacity: 0.22;
  background-image:
    linear-gradient(color-mix(in oklab, var(--color-primary) 60%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 60%, transparent) 1px, transparent 1px);
  background-size: 64px 64px;
  transform: perspective(500px) rotateX(62deg);
  transform-origin: 50% 0;
  mask-image: linear-gradient(transparent, #000 40%, #000 70%, transparent);
  animation: intro-grid 2.4s linear infinite;
}
@keyframes intro-grid {
  to { background-position: 0 64px, 0 0; }
}
.intro-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 46%, transparent 40%, rgb(0 0 0 / 0.78));
}
.intro-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background: repeating-linear-gradient(0deg, transparent 0 2px, rgb(0 0 0 / 0.25) 2px 3px);
}
/* Cinematic letterbox: retracts when the seal locks */
.intro-bars i {
  position: absolute;
  left: 0;
  right: 0;
  height: 9svh;
  background: #000;
  transition: transform 0.9s cubic-bezier(0.7, 0, 0.2, 1);
}
.intro-bars i:first-child { top: 0; }
.intro-bars i:last-child { bottom: 0; }
.intro.is-locked .intro-bars i:first-child { transform: translateY(-100%); }
.intro.is-locked .intro-bars i:last-child { transform: translateY(100%); }
.intro-corner {
  position: absolute;
  z-index: 2;
  width: 1.5rem;
  height: 1.5rem;
  border: 0 solid var(--color-primary);
  opacity: 0.85;
}
.intro-corner.is-tl { top: 1rem; left: 1rem; border-width: 2px 0 0 2px; }
.intro-corner.is-tr { top: 1rem; right: 1rem; border-width: 2px 2px 0 0; }
.intro-corner.is-bl { bottom: 1rem; left: 1rem; border-width: 0 0 2px 2px; }
.intro-corner.is-br { bottom: 1rem; right: 1rem; border-width: 0 2px 2px 0; }
.intro-tag {
  position: absolute;
  z-index: 2;
  top: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}
.intro-tag.is-l { left: 3.25rem; }
.intro-tag.is-r { right: 3.25rem; text-align: right; }
.intro-rec {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #ff3b4e;
  box-shadow: 0 0 10px #ff3b4e;
  animation: intro-blink 1s steps(2) infinite;
}
@keyframes intro-blink {
  50% { opacity: 0.15; }
}
@media (max-width: 560px) {
  .intro-tag.is-r { display: none; }
}
/* The discipline's name, ghosted huge behind its particle shape */
.intro-domain {
  position: absolute;
  left: 50%;
  top: 44%;
  translate: -50% -50%;
  margin: 0;
  pointer-events: none;
  white-space: nowrap;
  font-family: var(--font-brand);
  font-weight: 900;
  font-size: clamp(3.2rem, 15vw, 13rem);
  line-height: 1;
  letter-spacing: 0.06em;
  color: transparent;
  -webkit-text-stroke: 1.5px color-mix(in oklab, var(--color-primary) 55%, transparent);
  opacity: 0;
}
.intro-domain.is-in {
  animation: intro-domain 0.72s ease-out both;
}
@keyframes intro-domain {
  0% { opacity: 0; transform: scale(1.18); filter: blur(8px); letter-spacing: 0.3em; }
  30% { opacity: 0.55; transform: scale(1); filter: blur(0); letter-spacing: 0.06em; }
  80% { opacity: 0.4; }
  100% { opacity: 0; transform: scale(0.96); }
}
/* Without WebGL: a pulsing wordmark */
.intro-mark {
  display: none;
  position: absolute;
  left: 50%;
  top: 44%;
  translate: -50% -50%;
  margin: 0;
  font-family: var(--font-brand);
  font-weight: 900;
  font-size: clamp(4rem, 20vw, 12rem);
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 30px var(--color-primary), 0 0 70px color-mix(in oklab, var(--color-primary) 50%, transparent);
}
.intro.is-fallback .intro-mark {
  display: block;
  animation: intro-pulse 1.6s ease-in-out infinite alternate;
}
.intro-titles {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: calc(44% + var(--seal) * 0.29);
  translate: -50% 0;
  width: min(44rem, 92vw);
  display: grid;
  gap: 0.35rem;
  justify-items: center;
  text-align: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.intro.is-locked .intro-titles,
.intro.is-fallback .intro-titles {
  opacity: 1;
}
.intro-title {
  min-height: 1.2em;
  font-family: var(--font-brand);
  font-weight: 800;
  font-size: clamp(1.05rem, 3.2vw, 2rem);
  letter-spacing: 0.22em;
  color: #fff;
  text-shadow:
    0 0 18px color-mix(in oklab, var(--color-primary) 80%, transparent),
    0 0 42px color-mix(in oklab, var(--color-primary) 45%, transparent);
  white-space: nowrap;
}
.intro-subtitle {
  min-height: 1em;
  font-size: clamp(0.6rem, 1.6vw, 0.8rem);
  letter-spacing: 0.4em;
  color: var(--color-primary);
}
/* Boot log, bottom left (desktop) */
.intro-log {
  position: absolute;
  z-index: 2;
  left: 3.25rem;
  bottom: calc(9svh + 1.4rem);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: 26rem;
  font-size: 0.6875rem;
  line-height: 1.35;
  text-transform: none;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  transition: bottom 0.9s cubic-bezier(0.7, 0, 0.2, 1);
}
.intro.is-locked .intro-log {
  bottom: 2.2rem;
}
.intro-log p {
  animation: intro-line 0.3s ease-out both;
}
.intro-log p.is-ok::first-letter {
  color: var(--color-primary);
}
.intro-log p:not(:nth-last-child(-n + 5)) {
  display: none;
}
@keyframes intro-line {
  from { opacity: 0; translate: -8px 0; }
}
@media (max-width: 900px) {
  .intro-log { display: none; }
}
.intro-bottom {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: max(1.6rem, 4.5vh);
  translate: -50% 0;
  display: grid;
  width: min(22rem, 78vw);
  gap: 0.55rem;
  justify-items: center;
}
.intro.is-locked .intro-readout,
.intro.is-locked .intro-bar {
  opacity: 0;
  transition: opacity 0.5s ease;
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
  height: 5px;
  background: color-mix(in oklab, var(--color-border) 80%, transparent);
  clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
}
.intro-bar i {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent), #fff);
  box-shadow: 0 0 14px var(--color-primary);
}
.intro-skip {
  margin-top: 0.2rem;
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
  z-index: 3;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 44%, #fff, color-mix(in oklab, var(--color-primary) 65%, #fff) 40%, color-mix(in oklab, var(--color-primary) 30%, transparent) 80%);
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
/* Sound gate: a glowing "Enter" in the dark */
.intro-gate {
  position: absolute;
  left: 50%;
  top: 44%;
  z-index: 4;
  display: none;
  translate: -50% -50%;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1.1rem 2.4rem;
  font-size: 1rem;
  letter-spacing: 0.32em;
  color: var(--color-on-primary);
  background: var(--color-primary);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  cursor: pointer;
  animation: intro-gate-pulse 1.4s ease-in-out infinite alternate;
}
.intro-gate small {
  font-size: 0.625rem;
  letter-spacing: 0.24em;
  opacity: 0.75;
}
.intro.is-gated .intro-gate {
  display: flex;
}
.intro.is-gated .intro-bottom > :not(.intro-skip),
.intro.is-gated .intro-log {
  visibility: hidden;
}
@keyframes intro-gate-pulse {
  from { filter: drop-shadow(0 0 0.4rem var(--color-primary)); }
  to { filter: drop-shadow(0 0 1.6rem var(--color-primary)); }
}
@media (max-width: 560px) {
  .intro-title {
    white-space: normal;
    letter-spacing: 0.12em;
    font-size: 1.05rem;
    line-height: 1.3;
  }
  .intro-subtitle {
    letter-spacing: 0.24em;
  }
}
@media (max-height: 560px) {
  .intro-titles { display: none; }
}
`;
