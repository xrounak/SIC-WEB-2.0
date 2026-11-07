"use client";

import { useEffect, useRef } from "react";

/**
 * The living layer of the page background, drawn on one 2D canvas behind the content.
 *
 * Always moving: a slow-drifting circuit network (nodes joined by faint links when
 * they're close), with signals pulsing along the links, and large outline gears
 * turning slowly at the edges.
 *
 * On scroll: the network moves in layered parallax (near nodes faster than far ones),
 * the gears turn with the scroll, fast scrolling stretches the nodes into speed
 * streaks, and a glowing rail on the right traces how far down the page you are.
 *
 * Colours follow the active theme. Paused while the tab is hidden; drawn once and kept
 * still for visitors who prefer reduced motion. Cheap enough for phones (fewer nodes,
 * capped pixel ratio, no work when nothing is visible).
 */

type Node = { x: number; y: number; vx: number; vy: number; depth: number; r: number; phase: number };
type Signal = { a: number; b: number; t: number; speed: number };

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback;
  return { primary: get("--color-primary", "#78a9ff"), accent: get("--color-accent", "#ff7a32") };
}

/** "#rrggbb" or "rgb(...)" to an rgba() string with a new alpha. */
function withAlpha(color: string, alpha: number) {
  const c = color.trim();
  if (c.startsWith("#")) {
    const h = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1, 7);
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }
  const m = c.match(/[\d.]+/g);
  if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
  return `rgba(120,169,255,${alpha})`;
}

function gearPath(g: CanvasRenderingContext2D, r: number, teeth: number) {
  const step = (Math.PI * 2) / teeth;
  const inner = r * 0.84;
  g.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: Array<[number, number]> = [
      [inner, a],
      [r, a + step * 0.14],
      [r, a + step * 0.44],
      [inner, a + step * 0.58],
    ];
    pts.forEach(([rad, ang], j) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (i === 0 && j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
  }
  g.closePath();
  g.moveTo(r * 0.42, 0);
  g.arc(0, 0, r * 0.42, 0, Math.PI * 2);
}

export function AmbientField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    const signals: Signal[] = [];
    let colors = readColors();

    const build = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const small = W < 768;
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(small ? 38 : 78, (W * H) / 16000));
      nodes = Array.from({ length: count }, () => {
        const depth = 0.25 + Math.random() * 0.75;
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.12 * depth,
          vy: (Math.random() - 0.5) * 0.12 * depth,
          depth,
          r: 1.1 + depth * 2,
          phase: Math.random() * Math.PI * 2,
        };
      });
      signals.length = 0;
    };
    build();

    // Theme changes (the seasonal switcher) recolour the field.
    const themeWatch = new MutationObserver(() => {
      colors = readColors();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });

    let scrollY = window.scrollY;
    let lastScroll = scrollY;
    let velocity = 0;
    let time = 0;
    let last = performance.now();
    let raf = 0;
    const LINK = 140;

    const draw = (dt: number) => {
      g.clearRect(0, 0, W, H);
      const docH = Math.max(1, document.documentElement.scrollHeight - H);
      const progress = Math.min(1, Math.max(0, scrollY / docH));
      const speed = Math.max(-1, Math.min(1, velocity / 40));

      // ---- Gears at the edges: turn slowly, and with the scroll
      const gears: Array<[number, number, number, number, number]> = [
        // x, y, radius, teeth, direction
        [W * 0.04, H * 0.22, Math.min(W, H) * 0.2, 14, 1],
        [W * 0.97, H * 0.72, Math.min(W, H) * 0.26, 18, -1],
        [W * 0.86, H * 0.08, Math.min(W, H) * 0.1, 10, 1],
      ];
      g.lineWidth = 1;
      gears.forEach(([x, y, r, teeth, dir], i) => {
        g.save();
        // They bob up and down a little as you scroll.
        g.translate(x, y - Math.sin(scrollY / 900 + i) * 22);
        g.rotate(dir * (time * 0.05 + scrollY * 0.0016));
        gearPath(g, r, teeth);
        g.strokeStyle = withAlpha(i === 1 ? colors.accent : colors.primary, 0.2);
        g.lineWidth = 2;
        g.stroke();
        g.restore();
      });

      // ---- The network
      const pos = nodes.map((n) => {
        // Parallax: nearer nodes (higher depth) slide further with the scroll.
        let y = (n.y - scrollY * n.depth * 0.35) % H;
        if (y < 0) y += H;
        return { x: n.x, y };
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
          const d = Math.hypot(dx, dy);
          if (d > LINK) continue;
          const a = (1 - d / LINK) * 0.5 * Math.min(nodes[i].depth, nodes[j].depth);
          g.strokeStyle = withAlpha(colors.primary, a);
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(pos[i].x, pos[i].y);
          g.lineTo(pos[j].x, pos[j].y);
          g.stroke();
          // Now and then a signal sets off along a link.
          if (!reduced && signals.length < 6 && Math.random() < 0.0009) signals.push({ a: i, b: j, t: 0, speed: 0.6 + Math.random() * 0.8 });
        }
      }

      // Signals travelling along links
      for (let k = signals.length - 1; k >= 0; k--) {
        const s = signals[k];
        s.t += dt * s.speed;
        const A = pos[s.a];
        const B = pos[s.b];
        if (s.t >= 1 || !A || !B || Math.hypot(A.x - B.x, A.y - B.y) > LINK * 1.3) {
          signals.splice(k, 1);
          continue;
        }
        const x = A.x + (B.x - A.x) * s.t;
        const y = A.y + (B.y - A.y) * s.t;
        const glow = g.createRadialGradient(x, y, 0, x, y, 9);
        glow.addColorStop(0, withAlpha(colors.accent, 0.9));
        glow.addColorStop(1, withAlpha(colors.accent, 0));
        g.fillStyle = glow;
        g.beginPath();
        g.arc(x, y, 9, 0, Math.PI * 2);
        g.fill();
      }

      // Nodes: pulse gently; stretch into streaks while scrolling fast
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const p = pos[i];
        const pulse = 0.55 + Math.sin(time * 1.6 + n.phase) * 0.25;
        const a = Math.min(1, (0.45 + n.depth * 0.6) * pulse);
        const stretch = speed * n.depth * 26;
        if (Math.abs(stretch) > 1.5) {
          g.strokeStyle = withAlpha(colors.primary, a);
          g.lineWidth = n.r;
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(p.x, p.y + stretch);
          g.stroke();
          g.lineWidth = 1;
        } else {
          g.fillStyle = withAlpha(colors.primary, a);
          g.beginPath();
          g.arc(p.x, p.y, n.r, 0, Math.PI * 2);
          g.fill();
        }
      }

      // ---- Progress rail on the right: traces how far down the page you are
      if (docH > H * 0.3) {
        const x = W - (W < 768 ? 6 : 14);
        const top = H * 0.12;
        const len = H * 0.76;
        g.strokeStyle = withAlpha(colors.primary, 0.2);
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(x, top);
        g.lineTo(x, top + len);
        g.stroke();
        const head = top + len * progress;
        const grad = g.createLinearGradient(0, top, 0, head);
        grad.addColorStop(0, withAlpha(colors.primary, 0));
        grad.addColorStop(1, withAlpha(colors.accent, 0.75));
        g.strokeStyle = grad;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, top);
        g.lineTo(x, head);
        g.stroke();
        // Checkpoints light up as you pass them
        for (let k = 0; k <= 8; k++) {
          const cy = top + (len * k) / 8;
          const lit = progress * 8 >= k - 0.001;
          g.fillStyle = withAlpha(lit ? colors.accent : colors.primary, lit ? 0.85 : 0.2);
          g.fillRect(x - (lit ? 3 : 2), cy - 0.5, lit ? 6 : 4, 1);
        }
        const glow = g.createRadialGradient(x, head, 0, x, head, 12 + Math.abs(speed) * 10);
        glow.addColorStop(0, withAlpha(colors.accent, 0.9));
        glow.addColorStop(1, withAlpha(colors.accent, 0));
        g.fillStyle = glow;
        g.beginPath();
        g.arc(x, head, 12 + Math.abs(speed) * 10, 0, Math.PI * 2);
        g.fill();
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      time += dt;
      scrollY = window.scrollY;
      const v = scrollY - lastScroll;
      lastScroll = scrollY;
      velocity += (v - velocity) * 0.18;
      for (const n of nodes) {
        n.x += n.vx * (1 + Math.abs(velocity) * 0.02);
        n.y += n.vy;
        if (n.x < -10) n.x = W + 10;
        if (n.x > W + 10) n.x = -10;
        if (n.y < 0) n.y += H;
        if (n.y > H) n.y -= H;
      }
      draw(dt);
    };

    const onResize = () => {
      build();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);

    if (reduced) {
      draw(0);
      const onScroll = () => {
        scrollY = window.scrollY;
        draw(0);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        themeWatch.disconnect();
      };
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      themeWatch.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ambient-field" aria-hidden="true" />;
}
