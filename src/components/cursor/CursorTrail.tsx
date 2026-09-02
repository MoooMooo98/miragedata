"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; age: number };

/**
 * A soft red "brake light" trail that follows the cursor — a single
 * continuous, tapering ribbon of light with a real glow, not a string
 * of separate dots.
 */
export default function CursorTrail({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isCoarsePointer = window.matchMedia(
      "(hover: none), (pointer: coarse)"
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (isCoarsePointer || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const target = { x: width / 2, y: height / 2 };
    const lead = { x: width / 2, y: height / 2 };
    const points: Point[] = [];
    let hasMoved = false;
    let speed = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      hasMoved = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const MAX_AGE = 34;

    const drawRibbon = (
      pts: Point[],
      widthFor: (life: number) => number,
      colorFor: (life: number, alpha: number) => string
    ) => {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const life = 1 - b.age / MAX_AGE;
        if (life <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = widthFor(life);
        ctx.strokeStyle = colorFor(life, life);
        ctx.stroke();
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, width, height);
      if (!enabledRef.current || !hasMoved) return;

      const prevX = lead.x;
      const prevY = lead.y;
      lead.x += (target.x - lead.x) * 0.2;
      lead.y += (target.y - lead.y) * 0.2;

      const dx = lead.x - prevX;
      const dy = lead.y - prevY;
      const instant = Math.min(28, Math.hypot(dx, dy));
      speed += (instant - speed) * 0.35;

      points.push({ x: lead.x, y: lead.y, age: 0 });
      if (points.length > 46) points.shift();
      for (const p of points) p.age += 1;
      while (points.length && points[0].age >= MAX_AGE) points.shift();

      if (points.length > 1) {
        ctx.globalCompositeOperation = "lighter";

        // Outer bloom: wide, soft, heavily blurred glow.
        ctx.save();
        ctx.filter = "blur(7px)";
        drawRibbon(
          points,
          (life) => 3 + life * 9 + speed * 0.15,
          (life) => `rgba(255, 35, 48, ${0.22 * life})`
        );
        ctx.restore();

        // Mid layer: the visible ribbon of light.
        drawRibbon(
          points,
          (life) => 1.5 + life * 4.5,
          (life) => `rgba(255, 70, 75, ${0.5 * life})`
        );

        // Hot core: thin, bright, concentrated near the tip.
        drawRibbon(
          points,
          (life) => Math.max(0.6, life * 2.1),
          (life) => `rgba(255, 205, 195, ${0.55 * life * life})`
        );

        // Lens highlight at the very tip, like a brake-light reflector.
        const tip = points[points.length - 1];
        const glow = ctx.createRadialGradient(
          tip.x,
          tip.y,
          0,
          tip.x,
          tip.y,
          9 + speed * 0.2
        );
        glow.addColorStop(0, "rgba(255, 225, 220, 0.85)");
        glow.addColorStop(0.35, "rgba(255, 45, 58, 0.55)");
        glow.addColorStop(1, "rgba(255, 20, 35, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 9 + speed * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
