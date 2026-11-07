import * as THREE from "three";
import gsap from "gsap";
import { playSound } from "../../seasonal/themes/shared/sfx";

/**
 * "Four disciplines", the intro scene.
 *
 *  1. A spark lights up in the dark and bursts into a spinning galaxy of particles.
 *  2. On a beat, the particles flow through the club's four disciplines: a gear
 *     (Mechanical), an arch bridge (Civil), a robot sending signals (IoT & Robotics)
 *     and </> (Software). Each name is ghosted huge behind its shape.
 *  3. They fuse into a giant SIC wordmark. Lock: shockwave rings, a drum hit, an RGB
 *     glitch and a scan line sweeping across, while the club name decodes below.
 *  4. Finish: every particle blasts past the camera at warp speed, the screen flashes
 *     and the site irises open.
 *
 * One GPU particle system (a small custom shader) does the work, so it stays smooth on
 * phones. Every shape is drawn here in code (canvas paths and text) and sampled into
 * particle targets. Loaded only for the intro; normal page loads never touch three.js.
 */
export type IntroUi = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  percent: HTMLElement;
  status: HTMLElement;
  bar: HTMLElement;
  flash: HTMLElement;
  title: HTMLElement;
  subtitle: HTMLElement;
  log: HTMLElement;
  domain: HTMLElement;
};

export type IntroColors = { primary: string; accent: string };

const LOG: Array<[number, string]> = [
  [2, "> sic.boot --campus=gec-palamu"],
  [12, "[ok] power rails .............. 5V"],
  [24, "[ok] mechanical ............... torque locked"],
  [38, "[ok] civil .................... load tested"],
  [52, "[ok] iot & robotics ........... signal up"],
  [66, "[ok] software ................. compiled"],
  [80, "[ok] members.sync"],
  [97, "> ready. welcome to SIC"],
];

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uArc;
  uniform float uExplode;
  uniform float uSweep;
  uniform float uSize;
  uniform float uScale;
  uniform vec3 uPrimary;
  uniform vec3 uAccent;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  void main() {
    // Each particle leaves a little after its neighbours: the shape flows, not jumps.
    float t = clamp(uMix * 1.5 - aSeed.w * 0.5, 0.0, 1.0);
    float e = ease(t);
    vec3 p = mix(aFrom, aTo, e);
    // In flight: lift towards the camera and swirl a little around the centre.
    float flight = sin(t * 3.14159);
    p.z += flight * uArc * (0.8 + aSeed.z * 2.2);
    float sw = flight * 0.9 * (aSeed.x - 0.5);
    p.xy = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * p.xy;
    // Settled particles breathe.
    p.z += sin(uTime * 2.2 + aSeed.x * 40.0) * 0.04;

    // Warp: everything rushes past the camera.
    float x = uExplode * uExplode;
    p.z += x * (26.0 + aSeed.y * 48.0);
    p.xy *= 1.0 + x * (0.8 + aSeed.z * 2.2);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aSeed.z * 0.9) * (1.0 + flight * 0.35) * (1.0 + x * 4.0);
    gl_PointSize = size * uScale / max(-mv.z, 0.1);

    // Theme colours as a diagonal gradient, with a few white sparkles.
    float g = clamp(0.5 + (p.x + p.y * 0.6) / 8.0, 0.0, 1.0);
    vColor = mix(uPrimary, uAccent, g) * (0.8 + aSeed.y * 0.5);
    if (aSeed.z > 0.94) vColor = mix(vColor, vec3(1.0), 0.75);
    // Scan line sweeping across.
    float band = exp(-pow((p.x - uSweep) * 1.8, 2.0));
    vColor += band * vec3(0.9, 0.95, 1.0);
    vAlpha = 1.0 - uExplode * 0.5;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor * 1.4 * a, a * vAlpha);
  }
`;

// ---- The shapes, drawn on a 2D canvas and sampled into points ------------------------
const PX = 320;
type Draw = (g: CanvasRenderingContext2D) => void;

const fontOf = (v: string, fallback: string) => {
  const f = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  return f ? `${f}, ${fallback}` : fallback;
};

const drawGear: Draw = (g) => {
  const cx = PX / 2;
  const cy = PX / 2;
  const teeth = 12;
  const step = (Math.PI * 2) / teeth;
  g.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const pts: Array<[number, number]> = [
      [112, a],
      [138, a + step * 0.12],
      [138, a + step * 0.42],
      [112, a + step * 0.56],
    ];
    pts.forEach(([r, ang], j) => {
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      if (i === 0 && j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
  }
  g.closePath();
  g.arc(cx, cy, 78, 0, Math.PI * 2, true);
  g.fill("evenodd");
  // Hub and spokes
  g.beginPath();
  g.arc(cx, cy, 26, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 14;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    g.lineTo(cx + Math.cos(a) * 82, cy + Math.sin(a) * 82);
    g.stroke();
  }
};

const drawBridge: Draw = (g) => {
  g.lineWidth = 10;
  g.lineCap = "round";
  // Deck
  g.beginPath();
  g.moveTo(14, 204);
  g.lineTo(306, 204);
  g.stroke();
  // Arch
  g.beginPath();
  g.moveTo(42, 204);
  g.quadraticCurveTo(160, 20, 278, 204);
  g.stroke();
  // Hangers
  g.lineWidth = 5;
  for (let x = 66; x <= 254; x += 21) {
    const t = (x - 42) / 236;
    const y = (1 - t) * (1 - t) * 204 + 2 * (1 - t) * t * 20 + t * t * 204;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, 204);
    g.stroke();
  }
  // Piers
  g.fillRect(52, 204, 16, 62);
  g.fillRect(252, 204, 16, 62);
  // Water
  g.lineWidth = 4;
  for (const y of [282, 300]) {
    g.beginPath();
    for (let x = 10; x <= 310; x += 4) {
      const yy = y + Math.sin(x * 0.07 + y) * 4;
      if (x === 10) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
};

const drawRobot: Draw = (g) => {
  g.lineWidth = 11;
  g.lineCap = "round";
  g.lineJoin = "round";
  // Head
  g.beginPath();
  g.roundRect(74, 116, 172, 132, 26);
  g.stroke();
  // Eyes
  g.beginPath();
  g.arc(122, 170, 19, 0, Math.PI * 2);
  g.arc(198, 170, 19, 0, Math.PI * 2);
  g.fill();
  // Mouth grill
  g.lineWidth = 6;
  for (let x = 118; x <= 202; x += 21) {
    g.beginPath();
    g.moveTo(x, 214);
    g.lineTo(x, 230);
    g.stroke();
  }
  // Ears
  g.fillRect(52, 158, 18, 48);
  g.fillRect(250, 158, 18, 48);
  // Antenna and signal
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(160, 116);
  g.lineTo(160, 76);
  g.stroke();
  g.beginPath();
  g.arc(160, 68, 11, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 6;
  for (const r of [28, 48, 68]) {
    g.beginPath();
    g.arc(160, 68, r, -Math.PI * 0.82, -Math.PI * 0.18);
    g.stroke();
  }
};

const drawCode: Draw = (g) => {
  g.font = `800 150px ${fontOf("--font-rajdhani", "ui-monospace, monospace")}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("</>", PX / 2, PX / 2 + 6);
};

const drawSic: Draw = (g) => {
  g.font = `900 150px ${fontOf("--font-cinzel", "Georgia, serif")}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SIC", PX / 2, PX / 2 - 8);
  // A thin rule with a diamond under the word
  g.fillRect(70, 236, 72, 4);
  g.fillRect(178, 236, 72, 4);
  g.save();
  g.translate(160, 238);
  g.rotate(Math.PI / 4);
  g.fillRect(-7, -7, 14, 14);
  g.restore();
};

/** Points covering a drawn shape, `count` of them, mapped to a `size`-wide square. */
function sample(draw: Draw, count: number, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = PX;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  draw(g);
  const data = g.getImageData(0, 0, PX, PX).data;
  const hits: number[] = [];
  for (let y = 0; y < PX; y += 1) {
    for (let x = 0; x < PX; x += 1) {
      if (data[(y * PX + x) * 4 + 3] > 110) hits.push(x, y);
    }
  }
  const out = new Float32Array(count * 3);
  const n = hits.length / 2 || 1;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n) * 2;
    const jx = (Math.random() - 0.5) * 1.2;
    const jy = (Math.random() - 0.5) * 1.2;
    out[i * 3] = ((hits[k] + jx) / PX - 0.5) * size;
    out[i * 3 + 1] = -((hits[k + 1] + jy) / PX - 0.5) * size;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
  }
  return out;
}

function galaxy(count: number) {
  const out = new Float32Array(count * 3);
  const tilt = 0.55;
  for (let i = 0; i < count; i++) {
    const arm = i % 3;
    const r = Math.pow(Math.random(), 0.55) * 7.2 + 0.2;
    const a = arm * 2.0944 + r * 0.62 + (Math.random() - 0.5) * 0.55;
    const x = Math.cos(a) * r;
    const yFlat = Math.sin(a) * r;
    const z = (Math.random() - 0.5) * 0.6 * (1 - r / 9);
    out[i * 3] = x;
    out[i * 3 + 1] = yFlat * Math.cos(tilt) - z * Math.sin(tilt);
    out[i * 3 + 2] = yFlat * Math.sin(tilt) + z * Math.cos(tilt);
  }
  return out;
}

function glowTexture(color: THREE.Color) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, `#${color.getHexString()}`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function scramble(el: HTMLElement, text: string, duration: number, tick?: () => void) {
  const glyphs = "█▓▒░<>/\\#*+=01ABCDEFGHJKLMNPRSTUVXYZ";
  const start = performance.now();
  let lastShown = 0;
  const step = () => {
    const p = Math.min(1, (performance.now() - start) / duration);
    const shown = Math.floor(p * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) out += i < shown || text[i] === " " ? text[i] : glyphs[Math.floor(Math.random() * glyphs.length)];
    el.textContent = out;
    if (tick && shown !== lastShown) {
      lastShown = shown;
      if (shown % 3 === 0) tick();
    }
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = text;
  };
  step();
}

const SHAPES: Array<{ draw: Draw; label: string; word: string }> = [
  { draw: drawGear, label: "01 · Mechanical", word: "MECHANICAL" },
  { draw: drawBridge, label: "02 · Civil", word: "CIVIL" },
  { draw: drawRobot, label: "03 · IoT & Robotics", word: "ROBOTICS" },
  { draw: drawCode, label: "04 · Software", word: "SOFTWARE" },
  { draw: drawSic, label: "Science & Innovation", word: "" },
];

export async function startIntro(ui: IntroUi, colors: IntroColors) {
  const canvas = ui.canvas;
  const primary = new THREE.Color(colors.primary);
  const accent = new THREE.Color(colors.accent);
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const COUNT = small ? 8000 : 16000;
  const SIZE = 7.4;

  const stages = [galaxy(COUNT), ...SHAPES.map((s) => sample(s.draw, COUNT, SIZE))];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const disposables: Array<{ dispose(): void }> = [];
  const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o);

  // ---- The particle field ------------------------------------------------------------
  const from = new Float32Array(COUNT * 3); // all start at the spark
  const to = new Float32Array(stages[0]);
  const seed = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
  const geo = track(new THREE.BufferGeometry());
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  const aFrom = new THREE.BufferAttribute(from, 3);
  const aTo = new THREE.BufferAttribute(to, 3);
  geo.setAttribute("aFrom", aFrom);
  geo.setAttribute("aTo", aTo);
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);

  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 0 },
    uArc: { value: 1.6 },
    uExplode: { value: 0 },
    uSweep: { value: 99 },
    uSize: { value: small ? 0.13 : 0.11 },
    uScale: { value: 1 },
    uPrimary: { value: primary },
    uAccent: { value: accent },
  };
  const mat = track(
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  const field = new THREE.Points(geo, mat);
  scene.add(field);

  /** Start flowing from where the particles are now to stage `i`. */
  let stage = 0;
  const morphTo = (i: number) => {
    from.set(stages[stage]);
    to.set(stages[i]);
    aFrom.needsUpdate = true;
    aTo.needsUpdate = true;
    uniforms.uMix.value = 0;
    stage = i;
  };

  // ---- Spark, shockwaves, warp streaks ----------------------------------------------
  const spark = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: track(glowTexture(primary)), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  spark.scale.setScalar(0.01);
  scene.add(spark);

  const ringGeo = track(new THREE.RingGeometry(0.97, 1, 160));
  const rings = [primary, accent, new THREE.Color(0xffffff)].map((c) => {
    const m = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
    m.scale.setScalar(0.1);
    scene.add(m);
    return m;
  });

  const STREAKS = small ? 260 : 520;
  const streakPos = new Float32Array(STREAKS * 6);
  const streakBase = Array.from({ length: STREAKS }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 11;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 90, speed: 0.6 + Math.random() * 0.8 };
  });
  const streakGeo = track(new THREE.BufferGeometry());
  streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPos, 3));
  const streakMat = track(new THREE.LineBasicMaterial({ color: primary.clone().lerp(new THREE.Color(0xffffff), 0.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  scene.add(streaks);
  const warp = { v: 0 };

  // ---- Sizing, pointer tilt, render loop ---------------------------------------------
  let baseZ = 14;
  let lookY = 0;
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The shape box fills min(60% of the height, 80% of the width), a little above centre.
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    baseZ = Math.max((SIZE * 1.67) / (2 * half), (SIZE * 1.25) / (2 * half * camera.aspect));
    lookY = -0.06 * 2 * baseZ * half;
    uniforms.uScale.value = h * dpr * 0.5;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const shake = { v: 0 };
  const cam = { z: baseZ * 1.8, lift: 0.8 };
  const spin = { z: 0, v: 0.5 };
  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    uniforms.uTime.value += dt;
    spin.z += spin.v * dt;
    field.rotation.z = spin.z;
    field.rotation.y += (pointer.x * 0.24 - field.rotation.y) * 0.05;
    field.rotation.x += (pointer.y * 0.16 - field.rotation.x) * 0.05;
    const sx = (Math.random() - 0.5) * shake.v;
    const sy = (Math.random() - 0.5) * shake.v;
    camera.position.set(sx, lookY + cam.lift + sy, cam.z);
    camera.lookAt(0, lookY + cam.lift * 0.35, 0);
    spark.material.rotation += dt * 0.6;
    if (warp.v > 0.001) {
      streakMat.opacity = Math.min(1, warp.v * 1.4);
      const len = 2 + warp.v * 16;
      for (let i = 0; i < STREAKS; i++) {
        const b = streakBase[i];
        b.z += dt * (30 + 140 * warp.v) * b.speed;
        if (b.z > cam.z + 2) b.z -= 92;
        streakPos.set([b.x, b.y, b.z, b.x, b.y, b.z - len * b.speed], i * 6);
      }
      streakGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
  });

  // ---- HUD ---------------------------------------------------------------------------
  const progress = { p: 0 };
  let logShown = 0;
  const paint = () => {
    const p = Math.min(100, progress.p);
    ui.percent.textContent = `${String(Math.round(p)).padStart(3, "0")}%`;
    ui.bar.style.transform = `scaleX(${p / 100})`;
    while (logShown < LOG.length && p >= LOG[logShown][0]) {
      const line = document.createElement("p");
      line.textContent = LOG[logShown][1];
      if (LOG[logShown][1].startsWith("[ok]")) line.className = "is-ok";
      ui.log.appendChild(line);
      logShown++;
    }
  };
  paint();
  ui.status.textContent = "Ignition";

  const showDomain = (word: string, label: string) => {
    ui.status.textContent = label;
    ui.domain.textContent = word;
    ui.domain.classList.remove("is-in");
    void ui.domain.offsetWidth;
    if (word) ui.domain.classList.add("is-in");
  };
  const hit = () => {
    ui.canvas.classList.remove("is-hit");
    void ui.canvas.offsetWidth;
    ui.canvas.classList.add("is-hit");
  };

  // ---- Choreography ------------------------------------------------------------------
  gsap.ticker.lagSmoothing(0);
  const BEAT = 0.72;
  const FIRST = 1.25;
  const intro = gsap.timeline();
  // 1. Spark, burst into a galaxy
  intro.call(() => playSound("digital-power-up", { gain: 0.75 }), [], 0.05);
  intro.to(spark.scale, { x: 1.5, y: 1.5, duration: 0.5, ease: "expo.out" }, 0.05);
  intro.call(() => playSound("whoosh-medium-soft", { gain: 0.7 }), [], 0.4);
  intro.to(uniforms.uMix, { value: 1, duration: 0.85, ease: "power2.out" }, 0.42);
  intro.to(spark.scale, { x: 0.5, y: 0.5, duration: 0.7, ease: "power2.inOut" }, 0.55);
  intro.to(cam, { z: baseZ * 1.25, lift: 0.3, duration: 1.4, ease: "power2.inOut" }, 0.2);
  // 2. The four disciplines, then 3. SIC
  SHAPES.forEach((s, i) => {
    const at = FIRST + i * BEAT;
    const last = i === SHAPES.length - 1;
    intro.call(
      () => {
        morphTo(i + 1);
        showDomain(s.word, s.label);
        playSound(last ? "riser-1s-soft" : "whoosh-fast-soft", { gain: last ? 0.75 : 0.55, rate: last ? 1 : 0.9 + i * 0.07 });
      },
      [],
      at,
    );
    intro.to(uniforms.uMix, { value: 1, duration: last ? 0.75 : 0.55, ease: "power2.inOut" }, at);
    if (!last) intro.call(() => playSound("mechanical-latch-heavy", { gain: 0.5, rate: 0.95 + i * 0.06 }), [], at + 0.5);
  });
  // The galaxy stops spinning and settles upright for the shapes.
  intro.to(spin, { v: 0, duration: 0.6, ease: "power2.out" }, FIRST - 0.2);
  intro.call(() => {
    gsap.to(spin, { z: Math.round(spin.z / (Math.PI * 2)) * Math.PI * 2, duration: 0.7, ease: "power3.inOut" });
  }, [], FIRST - 0.1);
  intro.to(cam, { z: baseZ, lift: 0, duration: 1.2, ease: "power3.inOut" }, FIRST);
  intro.to(spark.scale, { x: 0, y: 0, duration: 0.5, ease: "power2.in" }, FIRST);
  const LOCK = FIRST + (SHAPES.length - 1) * BEAT + 0.72;
  intro.to(progress, { p: 88, duration: LOCK, ease: "power1.inOut", onUpdate: paint }, 0);
  // 4. Lock on SIC
  intro.call(() => {
    playSound("cinematic-drum-big", { gain: 0.85 });
    playSound("boom-hit-medium", { gain: 0.55 });
    hit();
    ui.root.classList.add("is-locked");
    scramble(ui.title, "SCIENCE & INNOVATION CLUB", 900, () => playSound("keyboard-letter-soft", { gain: 0.22, rate: 0.9 + Math.random() * 0.3 }));
    window.setTimeout(() => scramble(ui.subtitle, "GEC PALAMU · EST. 2023", 700), 380);
  }, [], LOCK);
  intro.fromTo(shake, { v: 0.55 }, { v: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, LOCK);
  rings.forEach((r, i) => {
    intro.fromTo(r.scale, { x: 0.4, y: 0.4 }, { x: 9 + i * 2.5, y: 9 + i * 2.5, duration: 1.1 + i * 0.15, ease: "expo.out", immediateRender: false }, LOCK + i * 0.07);
    intro.fromTo(r.material, { opacity: 0.95 }, { opacity: 0, duration: 1.1 + i * 0.15, ease: "power2.out", immediateRender: false }, LOCK + i * 0.07);
  });
  intro.fromTo(spark.scale, { x: 5, y: 5 }, { x: 0, y: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, LOCK);
  intro.fromTo(uniforms.uSweep, { value: -SIZE * 0.7 }, { value: SIZE * 0.7, duration: 1.1, ease: "power1.inOut", immediateRender: false }, LOCK + 0.1);
  intro.call(() => playSound("shimmer-medium-bright", { gain: 0.45 }), [], LOCK + 0.15);
  intro.to({}, { duration: 0.6 });

  let finishing: Promise<void> | null = null;
  const finish = (opts: { fast?: boolean } = {}) => {
    if (finishing) return finishing;
    finishing = new Promise<void>((resolve) => {
      const k = opts.fast ? 0.5 : 1;
      if (!opts.fast && intro.progress() < 1) {
        intro.eventCallback("onComplete", () => run(k, resolve));
        return;
      }
      run(k, resolve);
    });
    return finishing;
  };

  const run = (k: number, resolve: () => void) => {
    intro.kill();
    // Skipped early: jump straight to SIC.
    if (stage !== SHAPES.length) {
      morphTo(SHAPES.length);
      uniforms.uMix.value = 1;
      showDomain("", SHAPES[SHAPES.length - 1].label);
    }
    spin.v = 0;
    spin.z = 0;
    ui.root.classList.add("is-locked");
    if (!ui.title.textContent) ui.title.textContent = "SCIENCE & INNOVATION CLUB";
    if (!ui.subtitle.textContent) ui.subtitle.textContent = "GEC PALAMU · EST. 2023";
    const fin = gsap.timeline({ onComplete: resolve });
    fin.to(cam, { z: baseZ, lift: 0, duration: 0.3 * k, ease: "power2.out" }, 0);
    fin.to(progress, { p: 100, duration: 0.4 * k, ease: "power1.out", onUpdate: paint }, 0);
    fin.to({}, { duration: 0.25 * k });
    // Warp
    fin.call(() => playSound("whoosh-fast-medium", { gain: 0.8 }), [], ">");
    fin.to([ui.title, ui.subtitle], { opacity: 0, scale: 1.25, duration: 0.45 * k, ease: "power2.in" }, "<");
    fin.to(uniforms.uExplode, { value: 1, duration: 1.0 * k, ease: "power2.in" }, "<");
    fin.to(warp, { v: 1, duration: 0.9 * k, ease: "power2.in" }, "<");
    fin.to(camera, { fov: 70, duration: 1.0 * k, ease: "power2.in", onUpdate: () => camera.updateProjectionMatrix() }, "<");
    fin.call(() => playSound("boom-hit-medium", { gain: 0.6 }), [], ">-0.15");
    fin.fromTo(ui.flash, { opacity: 0 }, { opacity: 1, duration: 0.16 * k, ease: "power2.out" }, ">-0.2");
    fin.to(ui.root, { clipPath: "circle(0% at 50% 50%)", duration: 0.85 * k, ease: "power3.inOut" }, ">");
    fin.to(ui.flash, { opacity: 0, duration: 0.6 * k, ease: "power2.in" }, "<");
  };

  const dispose = () => {
    intro.kill();
    gsap.killTweensOf([progress, shake, cam, warp, spin, camera, spark.scale, ui.flash, ui.root, ui.title, ui.subtitle, ...rings.map((r) => r.scale), ...rings.map((r) => r.material)]);
    gsap.killTweensOf(Object.values(uniforms));
    renderer.setAnimationLoop(null);
    gsap.ticker.lagSmoothing(500, 33);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };

  return { finish, dispose };
}
