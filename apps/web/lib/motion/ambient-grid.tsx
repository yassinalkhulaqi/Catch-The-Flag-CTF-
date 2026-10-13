"use client";

import { useEffect, useRef } from "react";
import { useAmbientAllowed } from "@/lib/motion/reduced";

/**
 * Lightweight grid drift for the marketing hero. Pauses off-screen, when the
 * tab is hidden, and on low-power / reduced-motion devices.
 */
export function AmbientGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allowed = useAmbientAllowed();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !allowed) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let visible = true;
    const parent = canvas.parentElement;

    function resize() {
      if (!canvas || !parent) return;
      const rect = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    resize();

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    observer.observe(canvas);

    const start = performance.now();
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (!context || !canvas || !visible || document.hidden) return;
      const t = (now - start) / 1000;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const gap = 42 * Math.min(window.devicePixelRatio || 1, 1.5);
      const shift = (t * 8) % gap;
      context.strokeStyle = "rgba(242, 181, 68, 0.16)";
      context.lineWidth = 1;
      context.beginPath();
      for (let x = -gap + shift; x < canvas.width; x += gap) {
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
      }
      for (let y = -gap + shift; y < canvas.height; y += gap) {
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
      }
      context.stroke();
    }
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [allowed]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
