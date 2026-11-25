// Synthesises original Christmas SFX as 16-bit mono WAV. Usage: node scripts/synth-christmas-sfx.mjs <outDir>, then convert each WAV to public/sfx/<name>.mp3 with ffmpeg (see src/seasonal/README.md). Output is original and CC0.
import fs from "node:fs";
import path from "node:path";
const SR = 44100;
const out = process.argv[2];

let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);

function buf(sec) { return new Float32Array(Math.ceil(sec * SR)); }

/** One small jingle bell: inharmonic partials, fast decay, tiny noise rattle. */
function bell(b, t0, f, amp) {
  const partials = [[1, 1, 0.09], [2.32, 0.55, 0.06], [4.25, 0.3, 0.04], [6.63, 0.18, 0.025]];
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(0.35 * SR);
  for (const [r, a, d] of partials) {
    const ph = rnd() * Math.PI * 2;
    for (let i = 0; i < len && s0 + i < b.length; i++) {
      const t = i / SR;
      b[s0 + i] += amp * a * Math.sin(2 * Math.PI * f * r * t + ph) * Math.exp(-t / d) * Math.min(1, t / 0.0015);
    }
  }
  for (let i = 0; i < 0.02 * SR && s0 + i < b.length; i++) {
    b[s0 + i] += amp * 0.25 * (rnd() * 2 - 1) * Math.exp(-i / SR / 0.004);
  }
}

/** Glockenspiel bar note. */
function glock(b, t0, f, amp, dec = 0.9) {
  const partials = [[1, 1, dec], [2.76, 0.35, dec * 0.35], [5.4, 0.15, dec * 0.15]];
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(dec * 4 * SR);
  for (const [r, a, d] of partials) {
    for (let i = 0; i < len && s0 + i < b.length; i++) {
      const t = i / SR;
      b[s0 + i] += amp * a * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / d) * Math.min(1, t / 0.002);
    }
  }
}

function shake(b, t0, n, amp) {
  for (let k = 0; k < n; k++) bell(b, t0 + rnd() * 0.035, 2600 + rnd() * 2400, amp * (0.5 + rnd() * 0.5));
}

function fadeOut(b, sec) {
  const n = Math.floor(sec * SR);
  for (let i = 0; i < n; i++) b[b.length - 1 - i] *= i / n;
}

function write(name, b, peak = 0.89) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  const g = m ? peak / m : 1;
  const data = Buffer.alloc(b.length * 2);
  for (let i = 0; i < b.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i] * g)) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(out, name + ".wav"), Buffer.concat([h, data]));
}

// 1. Sleigh bells passing: rhythmic shakes (gallop), swell in then out. ~2.6 s
{
  const b = buf(2.8);
  const pattern = [0, 0.16, 0.24]; // da-da-dum gallop
  for (let bar = 0; bar < 7; bar++) {
    for (const off of pattern) {
      const t = 0.05 + bar * 0.34 + off;
      const env = Math.sin(Math.PI * Math.min(1, t / 2.5));
      shake(b, t, 6, 0.25 * (0.15 + env));
    }
  }
  fadeOut(b, 0.3);
  write("xmas-sleigh-bells", b);
}

// 2. Click: a single tiny jingle (two bells). ~0.3 s
{
  const b = buf(0.32);
  bell(b, 0, 3900, 0.8);
  bell(b, 0.018, 5200, 0.45);
  fadeOut(b, 0.05);
  write("xmas-jingle-click", b);
}

// 3. Page reveal: rising glockenspiel arpeggio G5 B5 D6 G6 with a jingle on top. ~1.6 s
{
  const b = buf(1.7);
  [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => glock(b, i * 0.09, f, 0.5 + i * 0.08, 0.5));
  shake(b, 0.3, 4, 0.12);
  fadeOut(b, 0.25);
  write("xmas-chime-reveal", b);
}

// 4. Scroll swish: short jingle shimmer, quiet. ~0.6 s
{
  const b = buf(0.6);
  for (let k = 0; k < 5; k++) shake(b, k * 0.07, 3, 0.2 * (1 - k / 6));
  fadeOut(b, 0.15);
  write("xmas-jingle-shimmer", b);
}
