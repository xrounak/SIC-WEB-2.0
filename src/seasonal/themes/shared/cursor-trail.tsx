"use client";

import { useEffect, useRef } from "react";
import type { CursorSpec } from "./cursor";

/**
 * Particle trail behind the themed cursor, drawn on one full-screen canvas. Only on
 * devices with a precise pointer (mouse/trackpad); off for reduced motion, idle when
 * nothing moves, and paused while the tab is hidden.
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  kind: "spark" | "candy" | "flame" | "smoke" | "flash";
};

const MAX_PARTICLES = 220;
const SPARK = ["#FFFBEA", "#FFF4C2", "#FFD166", "#F5B942", "#FF7A32"];
const CANDY = ["#D94F5C", "#5BC49A", "#D94F5C", "#E7C66A"];

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function CursorTrail({ spec }: { spec: CursorSpec }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const [dirX, dirY] = spec.direction ?? [-0.7, -0.7];
    const [offX, offY] = spec.emitOffset ?? (spec.trail === "candy" ? [20, 20] : [0, 0]);
    const particles: Particle[] = [];
    let pointer: { x: number; y: number } | null = null;
    let lastEmit = { x: -999, y: -999 };
    let raf = 0;
    let last = performance.now();

    const add = (p: Omit<Particle, "age">) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({ ...p, age: 0 });
    };

    const spark = (x: number, y: number, speed: [number, number]) => {
      const a = rand(0, Math.PI * 2);
      const s = rand(...speed);
      add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(18, 42), size: rand(0.8, 1.8), rot: 0, vr: 0, color: SPARK[(Math.random() * SPARK.length) | 0], kind: "spark" });
    };
    const candy = (x: number, y: number, pop = 1) => {
      add({ x, y, vx: rand(-1.2, 1.2) * pop, vy: rand(-2.4, -0.6) * pop, life: rand(60, 85), size: rand(4, 6.5), rot: rand(0, 6.28), vr: rand(-0.12, 0.12), color: CANDY[(Math.random() * CANDY.length) | 0], kind: "candy" });
    };
    const flame = (x: number, y: number, power = 1) => {
      const spread = rand(-0.45, 0.45);
      const cos = Math.cos(spread);
      const sin = Math.sin(spread);
      const s = rand(1.4, 3.6) * power;
      add({ x, y, vx: (dirX * cos - dirY * sin) * s, vy: (dirX * sin + dirY * cos) * s, life: rand(14, 26) * (power > 1 ? 1.3 : 1), size: rand(2.5, 5) * Math.min(power, 1.6), rot: 0, vr: 0, color: "", kind: "flame" });
    };
    const smoke = (x: number, y: number) => {
      add({ x, y, vx: dirX * rand(0.4, 1) + rand(-0.3, 0.3), vy: dirY * rand(0.4, 1) - rand(0.2, 0.5), life: rand(40, 70), size: rand(3, 6), rot: 0, vr: 0, color: "", kind: "smoke" });
    };

    const emitMove = (x: number, y: number) => {
      const dist = Math.hypot(x - lastEmit.x, y - lastEmit.y);
      if (spec.trail === "sparkle") {
        if (dist > 4) {
          for (let i = 0; i < 3; i++) spark(x, y, [1, 3.4]);
          lastEmit = { x, y };
        }
      } else if (spec.trail === "candy") {
        if (dist > 26) {
          candy(x, y);
          lastEmit = { x, y };
        }
      } else if (dist > 6) {
        flame(x, y);
        flame(x, y);
        if (Math.random() < 0.35) smoke(x, y);
        lastEmit = { x, y };
      }
    };

    const emitClick = (x: number, y: number) => {
      if (spec.trail === "sparkle") for (let i = 0; i < 26; i++) spark(x, y, [2, 6]);
      else if (spec.trail === "candy") for (let i = 0; i < 7; i++) candy(x, y, 1.6);
      else {
        add({ x, y, vx: 0, vy: 0, life: 7, size: 16, rot: 0, vr: 0, color: "", kind: "flash" });
        for (let i = 0; i < 26; i++) flame(x, y, 2.2);
        for (let i = 0; i < 6; i++) smoke(x, y);
      }
    };

    const drawCandy = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.fillStyle = p.color;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, p.size, a, a + Math.PI / 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(90, 26, 31, 0.6)";
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50) / 16.67;
      last = now;

      // A lit sparkler fizzes even when the pointer is still.
      if (spec.trail === "sparkle" && pointer) {
        spark(pointer.x + offX, pointer.y + offY, [0.6, 2.4]);
        if (Math.random() < 0.6) spark(pointer.x + offX, pointer.y + offY, [0.6, 2.4]);
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.life) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.age / p.life; // 0 → 1
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        if (p.kind === "spark") {
          p.vy += 0.07 * dt;
          p.vx *= 0.985;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 1 - t;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
          ctx.stroke();
        } else if (p.kind === "candy") {
          p.vy += 0.14 * dt;
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
          drawCandy(p);
        } else if (p.kind === "flame") {
          p.vx *= 0.94;
          p.vy = p.vy * 0.94 - 0.03 * dt;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = (1 - t) * 0.9;
          ctx.fillStyle = t < 0.25 ? "#FFF4C2" : t < 0.55 ? "#FFB45E" : "#FF6A1A";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "smoke") {
          p.vx *= 0.97;
          p.vy = p.vy * 0.97 - 0.01 * dt;
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = (1 - t) * 0.22;
          ctx.fillStyle = "#B9C3CE";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + t * 2.2), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = "#FFF4C2";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + t), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      const keepAlive = particles.length > 0 || (spec.trail === "sparkle" && pointer !== null);
      raf = keepAlive && !document.hidden ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (!raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer = { x: e.clientX, y: e.clientY };
      emitMove(e.clientX + offX, e.clientY + offY);
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      emitClick(e.clientX + offX, e.clientY + offY);
      wake();
    };
    const onLeave = () => {
      pointer = null;
    };
    const onVisible = () => {
      if (!document.hidden) wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [spec]);

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />;
}
