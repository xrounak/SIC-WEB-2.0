"use client";

import type { ThemeKey } from "../../registry";
import { readMode } from "../../use-mode";
import { sounds as diwali } from "../diwali/sfx";
import { sounds as christmas } from "../christmas/sfx";
import { sounds as independenceDay } from "../independence-day/sfx";
import { sounds as regular } from "../regular/sfx";

/**
 * Theme sound effects, from SFX Kit by Wyzowl (CC0), trimmed and compressed to MP3 in
 * public/sfx. Each theme lists its own sounds in ./themes/<theme>/sfx.ts; anything it
 * leaves out falls back to DEFAULTS below. Nothing downloads or plays unless the
 * visitor chose "Theme + sound", and the first gesture is what unlocks audio.
 *
 * Events
 *   click       buttons, links, switches
 *   key         a letter typed in a text field (plus enter / space)
 *   scroll      a soft swish after a long scroll (rate-limited)
 *   flyby       a plane / sleigh / car crossing the screen
 *   burst       a rocket going up and exploding (timed so the boom meets the burst)
 *   page        page change: clouds closing
 *   pageReveal  page change: clouds parting
 *   toggleOn / toggleOff   the header switch
 */
export type SfxEvent =
  | "click"
  | "key"
  | "enter"
  | "space"
  | "scroll"
  | "flyby"
  | "burst"
  | "page"
  | "pageReveal"
  | "toggleOn"
  | "toggleOff";

export type SoundSpec = {
  /** File name in public/sfx, without .mp3. */
  id: string;
  /** 0 to 1 against the master level. Default 1. */
  gain?: number;
  /** Random pitch range so repeats don't sound identical. Default none. */
  rate?: [number, number];
  /** For "burst": how long into the sound the boom lands, in ms. */
  leadMs?: number;
};

export type ThemeSounds = Partial<Record<SfxEvent, SoundSpec>>;

const DEFAULTS: ThemeSounds = {
  enter: { id: "keyboard-return-medium", gain: 0.7, rate: [0.97, 1.03] },
  space: { id: "keyboard-space-medium", gain: 0.6, rate: [0.97, 1.03] },
  toggleOn: { id: "click-toggle-on-medium", gain: 0.8 },
  toggleOff: { id: "click-toggle-off-medium", gain: 0.8 },
};

const THEME_SOUNDS: Record<ThemeKey, ThemeSounds> = { diwali, christmas, independenceDay, regular };

const MASTER_LEVEL = 0.55;
/** Minimum gap between plays of the same event, in ms. */
const COOLDOWN: Partial<Record<SfxEvent, number>> = { click: 70, key: 30, enter: 80, space: 40, scroll: 900, flyby: 2000, burst: 250 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<void>>();
const lastPlayed = new Map<SfxEvent, number>();

function activeTheme(): ThemeKey {
  return (document.documentElement.dataset.theme as ThemeKey) in THEME_SOUNDS ? (document.documentElement.dataset.theme as ThemeKey) : "regular";
}

function spec(event: SfxEvent, theme = activeTheme()): SoundSpec | undefined {
  return THEME_SOUNDS[theme][event] ?? DEFAULTS[event];
}

function audio() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = MASTER_LEVEL;
  master.connect(ctx.destination);
  watchFocus();
  return ctx;
}

/** Sound only plays while this tab is the one in front: visible and focused. */
const pageActive = () => document.visibilityState === "visible" && document.hasFocus();

/**
 * Pauses all site audio (theme sounds and the intro) when the tab is hidden or the
 * window loses focus, and resumes it on return. Set up once, with the audio context.
 */
function watchFocus() {
  const sync = () => setSfxActive(pageActive());
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("blur", sync);
  window.addEventListener("focus", sync);
  window.addEventListener("pagehide", sync);
}

function load(id: string) {
  const known = loading.get(id);
  if (known) return known;
  const task = (async () => {
    const context = audio();
    if (!context) return;
    const res = await fetch(`/sfx/${id}.mp3`);
    if (!res.ok) return;
    buffers.set(id, await context.decodeAudioData(await res.arrayBuffer()));
  })().catch(() => {
    loading.delete(id);
  });
  loading.set(id, task);
  return task;
}

/**
 * Creates the audio context and loads the active theme's sounds. Call it from a
 * click or key press (browsers only allow sound after one); it is safe to repeat.
 */
export async function prepareSfx() {
  const context = audio();
  if (!context) return;
  if (context.state === "suspended" && pageActive()) await context.resume().catch(() => {});
  const theme = activeTheme();
  const ids = new Set([...Object.values(THEME_SOUNDS[theme]), ...Object.values(DEFAULTS)].map((s) => s!.id));
  await Promise.all([...ids].map(load));
}

/** Pause audio while the tab is hidden or unfocused, resume when it is back. */
export function setSfxActive(active: boolean) {
  if (!ctx) return;
  if (active && pageActive() && ctx.state === "suspended") void ctx.resume().catch(() => {});
  if (!active && ctx.state === "running") void ctx.suspend().catch(() => {});
}

function playBuffer(id: string, gain: number, rate: number) {
  if (!ctx || !master || ctx.state !== "running") return;
  const buffer = buffers.get(id);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(master);
  src.start();
}

/**
 * Tries to get audio running. Browsers only allow sound after a click or key press,
 * so this succeeds on a gesture (or when the visitor has used the site a lot) and
 * otherwise resolves false, which is the cue for a "tap to enter" prompt.
 */
export async function unlockAudio(): Promise<boolean> {
  const context = audio();
  if (!context) return false;
  // Opened in a background tab: stay quiet (the intro then asks for a tap).
  if (!pageActive()) return false;
  if (context.state === "suspended") {
    await Promise.race([context.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
  }
  return context.state === "running";
}

/** Downloads and decodes sounds ahead of time. */
export function loadSounds(ids: string[]) {
  return Promise.all(ids.map(load));
}

/**
 * Plays one file regardless of the theme/sound switch. Used by the intro, whose
 * sound is part of the experience. `inMs` delays it.
 */
export function playSound(id: string, options: { gain?: number; rate?: number; inMs?: number } = {}) {
  if (typeof document === "undefined") return;
  const go = () => playBuffer(id, (options.gain ?? 1) * (0.95 + Math.random() * 0.1), options.rate ?? 1);
  if (options.inMs) window.setTimeout(go, options.inMs);
  else go();
}

/**
 * Plays the active theme's sound for an event, if the visitor has sound on.
 * `inMs` schedules it that far in the future; for "burst" the sound starts early
 * enough that its boom lands at that moment.
 */
export function playSfx(event: SfxEvent, options: { inMs?: number } = {}) {
  if (typeof document === "undefined" || readMode() !== "sound") return;
  const s = spec(event);
  if (!s) return;
  const start = () => {
    if (!ctx || !master || ctx.state !== "running") return;
    const now = performance.now();
    const gap = COOLDOWN[event] ?? 0;
    if (now - (lastPlayed.get(event) ?? -Infinity) < gap) return;
    const buffer = buffers.get(s.id);
    if (!buffer) return;
    lastPlayed.set(event, now);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (s.rate) src.playbackRate.value = s.rate[0] + Math.random() * (s.rate[1] - s.rate[0]);
    const gain = ctx.createGain();
    gain.gain.value = (s.gain ?? 1) * (0.9 + Math.random() * 0.2);
    src.connect(gain).connect(master);
    src.start();
  };
  const wait = Math.max(0, (options.inMs ?? 0) - (s.leadMs ?? 0));
  if (wait > 0) window.setTimeout(start, wait);
  else start();
}
