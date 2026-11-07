"use client";

import { useEffect, useRef } from "react";
import { INTRO_KEY } from "./boot";
import { INTRO_CSS } from "./intro-css";
import { loadSounds, unlockAudio } from "@/seasonal/themes/shared/sfx";

/** The shortest the intro plays, and the longest it waits for the page to finish loading. */
const MIN_MS = 4900;
const MAX_WAIT_MS = 7500;
/** Every sound the intro plays; loaded up front so each cue lands on time. */
const INTRO_SOUNDS = [
  "digital-power-up",
  "whoosh-medium-soft",
  "digital-process-subtle",
  "riser-1s-soft",
  "mechanical-latch-heavy",
  "cinematic-drum-big",
  "boom-hit-medium",
  "keyboard-letter-soft",
  "whoosh-fast-soft",
  "shimmer-medium-bright",
  "whoosh-fast-medium",
];

/**
 * Full-screen intro ("Four disciplines"), shown once per browser session. The markup renders
 * on the server so the cover is there from the first paint; the three.js scene
 * (components/intro/scene.ts) loads on demand. Without WebGL a pulsing SIC wordmark is
 * shown with a plain progress bar. The cover removes itself when the page has loaded and the show
 * has played, or on "Skip".
 */
export function IntroLoader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);
  const domain = useRef<HTMLParagraphElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const subtitle = useRef<HTMLParagraphElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const gate = useRef<HTMLButtonElement>(null);
  const skip = useRef<() => void>(() => {});

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro === "done") return;
    const refs = [root, canvas, percent, status, bar, flash, title, subtitle, log, domain];
    if (refs.some((r) => !r.current)) return;
    const ui = {
      root: root.current!,
      canvas: canvas.current!,
      percent: percent.current!,
      status: status.current!,
      bar: bar.current!,
      domain: domain.current!,
      flash: flash.current!,
      title: title.current!,
      subtitle: subtitle.current!,
      log: log.current!,
    };

    let cancelled = false;
    let skipped = false;
    let scene: { finish(o?: { fast?: boolean }): Promise<void>; dispose(): void } | null = null;
    const timers: number[] = [];
    const after = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));

    const leave = () => {
      html.dataset.intro = "done";
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        // Storage blocked: the intro simply plays again next visit.
      }
      scene?.dispose();
    };

    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
      timers.push(window.setTimeout(resolve, MAX_WAIT_MS));
    });
    // The minimum play time starts with the show (after the sound gate, if any).
    let minTimer = 0;
    let resolveMin: () => void = () => {};
    const minPlayed = new Promise<void>((resolve) => (resolveMin = resolve));
    const startMinClock = () => {
      minTimer = window.setTimeout(resolveMin, MIN_MS);
      timers.push(minTimer);
    };
    skip.current = () => {
      skipped = true;
      clearTimeout(minTimer);
      resolveMin();
    };

    (async () => {
      const colors = getComputedStyle(html);

      // The sound is part of the show. Browsers block audio until a click or key press,
      // so when it is blocked the intro waits behind an "Enter" button.
      const unlocked = await unlockAudio();
      if (!unlocked && !skipped) {
        ui.root.classList.add("is-gated");
        await new Promise<void>((resolve) => {
          const stop = new AbortController();
          const enter = () => {
            stop.abort();
            resolve();
          };
          gate.current?.addEventListener("click", enter, { signal: stop.signal });
          window.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && enter(), { signal: stop.signal });
          timers.push(window.setInterval(() => skipped && enter(), 100));
        });
        ui.root.classList.remove("is-gated");
        if (cancelled) return;
        await unlockAudio();
      }
      if (cancelled) return;
      await loadSounds(INTRO_SOUNDS);
      if (cancelled) return;
      startMinClock();
      ui.root.classList.add("is-playing");

      try {
        const { startIntro } = await import("./scene");
        if (cancelled) return;
        scene = await startIntro(ui, {
          primary: colors.getPropertyValue("--color-primary").trim() || "#78a9ff",
          accent: colors.getPropertyValue("--color-accent").trim() || "#ff7a32",
        });
        if (cancelled) scene.dispose();
      } catch {
        // No WebGL (or the chunk failed): show the seal with a plain progress bar.
        ui.root.classList.add("is-fallback");
        ui.bar.style.transform = "scaleX(1)";
        ui.bar.style.transition = `transform ${MIN_MS}ms ease-out`;
        ui.percent.textContent = "";
        ui.status.textContent = "Loading";
        ui.title.textContent = "SCIENCE & INNOVATION CLUB";
        ui.subtitle.textContent = "GEC PALAMU · EST. 2023";
      }
      await Promise.all([minPlayed, loaded]);
      if (cancelled) return;
      if (scene) await scene.finish({ fast: skipped });
      else {
        await after(skipped ? 0 : 400);
        ui.root.classList.add("is-leaving");
        await after(850);
      }
      if (!cancelled) leave();
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      scene?.dispose();
    };
  }, []);

  return (
    <div ref={root} className="intro" role="status" aria-label="Loading SIC">
      <p ref={domain} className="intro-domain" aria-hidden="true" />
      <canvas ref={canvas} className="intro-canvas" aria-hidden="true" />
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-scan" aria-hidden="true" />
      <div className="intro-bars" aria-hidden="true">
        <i />
        <i />
      </div>
      <span className="intro-corner is-tl" aria-hidden="true" />
      <span className="intro-corner is-tr" aria-hidden="true" />
      <span className="intro-corner is-bl" aria-hidden="true" />
      <span className="intro-corner is-br" aria-hidden="true" />

      <p className="intro-tag is-l hud-label" aria-hidden="true">
        <i className="intro-rec" /> SIC // Ignition sequence
      </p>
      <p className="intro-tag is-r hud-label" aria-hidden="true">
        GEC Palamu · Est. 2023
      </p>

      <p className="intro-mark" aria-hidden="true">
        SIC
      </p>

      <div className="intro-titles" aria-hidden="true">
        <p ref={title} className="intro-title" />
        <p ref={subtitle} className="intro-subtitle hud-label" />
      </div>

      <div ref={log} className="intro-log hud-label" aria-hidden="true" />

      <div className="intro-bottom">
        <div className="intro-readout hud-label">
          <span ref={status}>Ignition</span>
          <span ref={percent} className="tabular-nums">
            000%
          </span>
        </div>
        <div className="intro-bar" aria-hidden="true">
          <i ref={bar} />
        </div>
        <button type="button" className="intro-skip hud-label" onClick={() => skip.current()}>
          Skip intro
        </button>
      </div>
      <button ref={gate} type="button" className="intro-gate hud-label" tabIndex={-1}>
        <span>Enter SIC</span>
        <small>Sound on · best with headphones</small>
      </button>
      <div ref={flash} className="intro-flash" aria-hidden="true" />
      <style dangerouslySetInnerHTML={{ __html: INTRO_CSS }} />
      <noscript>
        <style>{`.intro{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
