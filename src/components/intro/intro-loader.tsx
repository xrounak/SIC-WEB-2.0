"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { INTRO_KEY } from "./boot";
import { INTRO_CSS } from "./intro-css";
import { loadSounds, unlockAudio } from "@/seasonal/themes/shared/sfx";

/** The shortest the intro plays, and the longest it waits for the page to finish loading. */
const MIN_MS = 3000;
const MAX_WAIT_MS = 7000;
/** Every sound the intro plays; loaded up front so each cue lands on time. */
const INTRO_SOUNDS = ["digital-power-up", "digital-process-subtle", "mechanical-latch-heavy", "riser-1s-soft", "boom-hit-medium", "shimmer-medium-bright", "whoosh-slow-medium"];

/**
 * Full-screen intro, shown once per browser session. The markup renders on the server
 * so the cover is there from the first paint; the three.js scene (components/intro/
 * scene.ts) loads on demand and draws into the canvas. If WebGL is unavailable the
 * seal is shown instead. The cover removes itself when the page has loaded and the
 * animation has played, or on "Skip".
 */
export function IntroLoader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const gate = useRef<HTMLButtonElement>(null);
  const skip = useRef<() => void>(() => {});

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro === "done") return;
    const els = { root: root.current, canvas: canvas.current, percent: percent.current, status: status.current, bar: bar.current, logo: logo.current, flash: flash.current };
    if (!els.root || !els.canvas || !els.percent || !els.status || !els.bar || !els.logo || !els.flash) return;
    const ui = { root: els.root, percent: els.percent, status: els.status, bar: els.bar, logo: els.logo, flash: els.flash };
    const canvasEl = els.canvas;

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
    const minPlayed = new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, MIN_MS);
      timers.push(id);
      skip.current = () => {
        skipped = true;
        clearTimeout(id);
        resolve();
      };
    });

    (async () => {
      const colors = getComputedStyle(html);

      // The intro's sound is part of it. Browsers block audio until a click or key
      // press, so when it is blocked the intro waits behind a "Tap to enter" button.
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

      try {
        const { startIntro } = await import("./scene");
        if (cancelled) return;
        scene = startIntro(canvasEl, ui, {
          primary: colors.getPropertyValue("--color-primary").trim() || "#F5B942",
          accent: colors.getPropertyValue("--color-accent").trim() || "#FF7A32",
        });
      } catch {
        // No WebGL (or the chunk failed): show the seal with a plain progress bar.
        ui.root.classList.add("is-fallback");
        ui.bar.style.transform = "scaleX(1)";
        ui.bar.style.transition = `transform ${MIN_MS}ms ease-out`;
        ui.percent.textContent = "";
        ui.status.textContent = "Loading";
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
      <canvas ref={canvas} className="intro-canvas" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-scan" aria-hidden="true" />
      <span className="intro-corner is-tl" aria-hidden="true" />
      <span className="intro-corner is-tr" aria-hidden="true" />
      <span className="intro-corner is-bl" aria-hidden="true" />
      <span className="intro-corner is-br" aria-hidden="true" />

      <p className="intro-tag is-l hud-label" aria-hidden="true">
        SIC // Boot sequence
      </p>
      <p className="intro-tag is-r hud-label" aria-hidden="true">
        GEC Palamu · Est. 2023
      </p>

      <div ref={logo} className="intro-logo" aria-hidden="true">
        <Image src="/logo.png" alt="" width={512} height={512} priority className="size-full" />
      </div>

      <div className="intro-bottom">
        <div className="intro-readout hud-label">
          <span ref={status}>Powering up</span>
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
        <span>Tap to enter</span>
        <small>Sound on</small>
      </button>
      <div ref={flash} className="intro-flash" aria-hidden="true" />
      <style dangerouslySetInnerHTML={{ __html: INTRO_CSS }} />
      <noscript>
        <style>{`.intro{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
