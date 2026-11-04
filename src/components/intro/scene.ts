import * as THREE from "three";
import gsap from "gsap";
import { playSound } from "../../seasonal/themes/shared/sfx";

/**
 * The intro scene: three gears (the ones on the club seal) fly in and mesh, each
 * holding a tiny animated emblem (atom, neural mesh, spark of an idea), inside a
 * turning HUD ring and a drifting particle field. A GSAP timeline flies the camera,
 * counts the progress, and on the finale spins everything up, flashes, and melts
 * into the real seal before the screen irises open. Loaded only for the intro, so
 * three.js never touches normal page loads.
 */
export type IntroUi = {
  root: HTMLElement;
  percent: HTMLElement;
  status: HTMLElement;
  bar: HTMLElement;
  logo: HTMLElement;
  flash: HTMLElement;
};

export type IntroColors = { primary: string; accent: string };

const STATUS: Array<[number, string]> = [
  [0, "Powering up"],
  [22, "Meshing gears"],
  [48, "Loading modules"],
  [76, "Syncing club data"],
  [97, "Ready"],
];

/** Gear outline: trapezoid teeth around a root circle, with a round hole. */
function gearShape(teeth: number, outer: number, root: number, hole: number) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  const rim = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [rim(root, a), rim(outer, a + step * 0.14), rim(outer, a + step * 0.46), rim(root, a + step * 0.6)];
    pts.forEach(([x, y], j) => (i === 0 && j === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  }
  shape.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(h);
  return shape;
}

function ellipsePoints(rx: number, ry: number, n = 96) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, 0);
  });
}

export function startIntro(canvas: HTMLCanvasElement, ui: IntroUi, colors: IntroColors) {
  const primary = new THREE.Color(colors.primary);
  const accent = new THREE.Color(colors.accent);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const disposables: Array<{ dispose(): void }> = [];
  const fadeables: THREE.Material[] = [];
  const track = <T extends { dispose(): void }>(o: T) => {
    disposables.push(o);
    return o;
  };
  const fade = <T extends THREE.Material>(m: T) => {
    m.transparent = true;
    fadeables.push(m);
    return track(m);
  };

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.PointLight(primary, 90, 40, 1.6);
  keyLight.position.set(0, 1, 9);
  const rimLight = new THREE.PointLight(accent, 70, 40, 1.6);
  rimLight.position.set(-7, -5, 5);
  scene.add(keyLight, rimLight);

  // ---- Gears, laid out like the seal: two on top, one below -------------------
  const layout: Array<{ x: number; y: number; dir: number; phase: number }> = [
    { x: -1.9, y: 1.15, dir: 1, phase: 0 },
    { x: 1.9, y: 1.15, dir: -1, phase: Math.PI / 12 },
    { x: 0, y: -2.15, dir: -1, phase: Math.PI / 12 },
  ];
  const gearGeo = track(
    new THREE.ExtrudeGeometry(gearShape(12, 2.0, 1.68, 1.28), {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 1,
      curveSegments: 14,
    }),
  );
  gearGeo.translate(0, 0, -0.17);
  const edgeGeo = track(new THREE.EdgesGeometry(gearGeo, 28));

  const gears = layout.map((spec) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      gearGeo,
      fade(new THREE.MeshStandardMaterial({ color: 0x0e131b, metalness: 0.85, roughness: 0.38, emissive: primary, emissiveIntensity: 0.06 })),
    );
    const edges = new THREE.LineSegments(edgeGeo, fade(new THREE.LineBasicMaterial({ color: primary, opacity: 0.95 })));
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(1.28, 0.025, 8, 64)), fade(new THREE.MeshBasicMaterial({ color: accent, opacity: 0.9 })));
    ring.position.z = 0.17;
    g.add(body, edges, ring);
    g.position.set(spec.x, spec.y, 0);
    g.rotation.z = spec.phase;
    scene.add(g);
    return g;
  });

  // ---- Emblems inside each gear (they do not spin with the gear) ----------------
  const emblems = layout.map((spec) => {
    const e = new THREE.Group();
    e.position.set(spec.x, spec.y, 0.2);
    scene.add(e);
    return e;
  });

  // Atom: three tilted orbits, a nucleus and an electron on each.
  const atom = emblems[0];
  const orbitPts = track(new THREE.BufferGeometry().setFromPoints(ellipsePoints(1.0, 0.38)));
  const electrons: Array<{ mesh: THREE.Mesh; speed: number; offset: number }> = [];
  const electronGeo = track(new THREE.SphereGeometry(0.075, 12, 12));
  for (let i = 0; i < 3; i++) {
    const orbit = new THREE.LineLoop(orbitPts, fade(new THREE.LineBasicMaterial({ color: accent, opacity: 0.85 })));
    orbit.rotation.z = (i * Math.PI) / 3;
    const electron = new THREE.Mesh(electronGeo, fade(new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 1 })));
    orbit.add(electron);
    electrons.push({ mesh: electron, speed: 1.6 + i * 0.5, offset: i * 2.1 });
    atom.add(orbit);
  }
  atom.add(new THREE.Mesh(track(new THREE.SphereGeometry(0.17, 16, 16)), fade(new THREE.MeshBasicMaterial({ color: primary, opacity: 1 }))));

  // Neural mesh: a wireframe icosahedron with bright nodes.
  const mesh = emblems[1];
  const ico = track(new THREE.IcosahedronGeometry(0.78, 1));
  const icoWire = new THREE.LineSegments(track(new THREE.WireframeGeometry(ico)), fade(new THREE.LineBasicMaterial({ color: accent, opacity: 0.9 })));
  const icoNodes = new THREE.Points(ico, fade(new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, sizeAttenuation: true, opacity: 1 })));
  mesh.add(icoWire, icoNodes);

  // Idea: a glowing core with rays that pulse.
  const idea = emblems[2];
  idea.add(new THREE.Mesh(track(new THREE.SphereGeometry(0.4, 24, 24)), fade(new THREE.MeshBasicMaterial({ color: primary, opacity: 1 }))));
  const halo = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.72, 24, 24)),
    fade(new THREE.MeshBasicMaterial({ color: primary, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })),
  );
  idea.add(halo);
  const rayPts: THREE.Vector3[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rayPts.push(new THREE.Vector3(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0), new THREE.Vector3(Math.cos(a) * 0.98, Math.sin(a) * 0.98, 0));
  }
  const rays = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(rayPts)), fade(new THREE.LineBasicMaterial({ color: accent, opacity: 0.9 })));
  idea.add(rays);

  // ---- HUD ring behind the gears --------------------------------------------------
  const hud = new THREE.Group();
  hud.position.z = -1.2;
  const ringA = new THREE.LineLoop(
    track(new THREE.BufferGeometry().setFromPoints(ellipsePoints(6.0, 6.0, 160))),
    fade(new THREE.LineBasicMaterial({ color: primary, opacity: 0.55 })),
  );
  const dashedGeo = track(new THREE.BufferGeometry().setFromPoints(ellipsePoints(6.5, 6.5, 200)));
  const ringB = new THREE.LineLoop(dashedGeo, fade(new THREE.LineDashedMaterial({ color: accent, dashSize: 0.28, gapSize: 0.22, opacity: 0.6 })));
  ringB.computeLineDistances();
  const tickPts: THREE.Vector3[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 0.42 : 0.2;
    tickPts.push(new THREE.Vector3(Math.cos(a) * 6.85, Math.sin(a) * 6.85, 0), new THREE.Vector3(Math.cos(a) * (6.85 + len), Math.sin(a) * (6.85 + len), 0));
  }
  const ticks = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(tickPts)), fade(new THREE.LineBasicMaterial({ color: primary, opacity: 0.4 })));
  hud.add(ringA, ringB, ticks);
  scene.add(hud);

  // ---- Particles -----------------------------------------------------------------------
  const count = 700;
  const positions = new Float32Array(count * 3);
  const tints = new Float32Array(count * 3);
  const white = new THREE.Color(0xffffff);
  for (let i = 0; i < count; i++) {
    const r = 9 + Math.random() * 20;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions.set([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t) * 0.7, r * Math.cos(p) - 6], i * 3);
    const c = Math.random() < 0.5 ? primary : Math.random() < 0.6 ? accent : white;
    tints.set([c.r, c.g, c.b], i * 3);
  }
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(tints, 3));
  const stars = new THREE.Points(
    starGeo,
    fade(new THREE.PointsMaterial({ size: 0.075, sizeAttenuation: true, vertexColors: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })),
  );
  scene.add(stars);

  // ---- Sizing, pointer parallax, render loop --------------------------------------
  let baseZ = 12;
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole gear cluster (about 9.5 wide, 9 tall) in view on tall and wide screens.
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    baseZ = Math.max(9.2 / (2 * half), 9.8 / (2 * half * camera.aspect));
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

  const spin = { v: 1 };
  let last = performance.now();
  let elapsed = 0;
  camera.position.set(0, 0, baseZ * 1.9);
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    const t = elapsed;
    gears.forEach((g, i) => (g.rotation.z += layout[i].dir * 0.55 * spin.v * dt));
    electrons.forEach((e, i) => {
      const a = t * e.speed * spin.v + e.offset;
      e.mesh.position.set(Math.cos(a) * 1.0, Math.sin(a) * 0.38, 0);
      void i;
    });
    atom.rotation.y = Math.sin(t * 0.8) * 0.5;
    mesh.rotation.x += 0.6 * spin.v * dt;
    mesh.rotation.y += 0.8 * spin.v * dt;
    rays.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
    halo.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08);
    ringA.rotation.z -= 0.08 * spin.v * dt;
    ringB.rotation.z += 0.16 * spin.v * dt;
    ticks.rotation.z += 0.05 * spin.v * dt;
    stars.rotation.y += 0.02 * spin.v * dt;
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 0.6 - camera.position.y) * 0.05;
    camera.lookAt(0, -0.3, 0);
    renderer.render(scene, camera);
  });

  // ---- Choreography -------------------------------------------------------------
  const progress = { p: 0 };
  const paint = () => {
    const p = Math.min(100, progress.p);
    ui.percent.textContent = `${String(Math.round(p)).padStart(3, "0")}%`;
    ui.bar.style.transform = `scaleX(${p / 100})`;
    const label = [...STATUS].reverse().find(([from]) => p >= from)?.[1] ?? STATUS[0][1];
    if (ui.status.textContent !== label) ui.status.textContent = label;
  };
  paint();

  // Follow the clock exactly (no lag smoothing), so a slow device never stretches the intro.
  gsap.ticker.lagSmoothing(0);
  const intro = gsap.timeline();
  gears.forEach((g, i) => {
    const to = { x: g.position.x, y: g.position.y };
    intro.from(g.position, { x: to.x * 3.2, y: to.y * 3.2 + (i - 1) * 5, z: -16, duration: 1.5, ease: "power3.out" }, 0.1 + i * 0.16);
    intro.from(g.scale, { x: 0.15, y: 0.15, z: 0.15, duration: 1.3, ease: "back.out(1.5)" }, 0.1 + i * 0.16);
  });
  emblems.forEach((e, i) => intro.from(e.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: "back.out(2)" }, 1.1 + i * 0.12));
  intro.from(hud.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 1.8, ease: "expo.out" }, 0);
  intro.from(hud.rotation, { z: -1.2, duration: 2, ease: "power3.out" }, 0);
  intro.to(camera.position, { z: baseZ, duration: 2.3, ease: "power3.inOut" }, 0);
  intro.to(progress, { p: 90, duration: 2.6, ease: "power2.out", onUpdate: paint }, 0);

  // Sound cues, tied to the animation (not the clock) so they stay in step on slow devices.
  intro.call(() => playSound("digital-power-up", { gain: 0.8 }), [], 0.05);
  intro.call(() => playSound("digital-process-subtle", { gain: 0.45 }), [], 0.55);
  [1.5, 1.68, 1.86].forEach((at, i) => intro.call(() => playSound("mechanical-latch-heavy", { gain: 0.7, rate: [1, 0.92, 1.08][i] }), [], at));

  let finishing: Promise<void> | null = null;
  const finish = (opts: { fast?: boolean } = {}) => {
    if (finishing) return finishing;
    finishing = new Promise<void>((resolve) => {
      const k = opts.fast ? 0.55 : 1;
      // Let the fly-in finish first (unless skipping), so the gears are always seen assembled.
      if (!opts.fast && intro.progress() < 1) {
        intro.eventCallback("onComplete", () => run(k, resolve));
        return;
      }
      run(k, resolve);
    });
    return finishing;
  };
  const run = (k: number, resolve: () => void) => {
    {
      intro.kill();
      const fin = gsap.timeline({ onComplete: resolve });
      // Riser into the flash, boom and shimmer on the flash, whoosh as the iris opens.
      fin.call(() => playSound("riser-1s-soft", { gain: 0.8 }), [], 0);
      fin.call(() => {
        playSound("boom-hit-medium", { gain: 0.9 });
        playSound("shimmer-medium-bright", { gain: 0.6, inMs: 120 });
      }, [], 1.0 * k);
      fin.call(() => playSound("whoosh-slow-medium", { gain: 0.6 }), [], 2.5 * k);
      fin.to(progress, { p: 100, duration: 0.45 * k, ease: "power1.out", onUpdate: paint });
      fin.to(spin, { v: 7, duration: 0.7 * k, ease: "power2.in" }, ">-0.1");
      fin.to(gears.map((g) => g.scale), { x: 1.22, y: 1.22, z: 1.22, duration: 0.7 * k, ease: "power2.in" }, "<");
      fin.to(camera.position, { z: baseZ * 0.82, duration: 0.7 * k, ease: "power2.in" }, "<");
      fin.fromTo(ui.flash, { opacity: 0 }, { opacity: 0.85, duration: 0.14 * k, ease: "power2.out" }, ">-0.05");
      fin.to(ui.flash, { opacity: 0, duration: 0.5 * k, ease: "power2.in" }, ">");
      fin.to(fadeables, { opacity: 0, duration: 0.45 * k, ease: "power1.in", stagger: 0 }, "<-0.1");
      fin.fromTo(ui.logo, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.8 * k, ease: "back.out(1.5)" }, "<");
      fin.to({}, { duration: 0.7 * k });
      fin.to(ui.root, { clipPath: "circle(0% at 50% 50%)", duration: 0.9 * k, ease: "power3.inOut" });
    }
  };

  const dispose = () => {
    intro.kill();
    gsap.killTweensOf([progress, spin, camera.position, ui.flash, ui.logo, ui.root, ...fadeables]);
    renderer.setAnimationLoop(null);
    gsap.ticker.lagSmoothing(500, 33);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };

  return { finish, dispose };
}
