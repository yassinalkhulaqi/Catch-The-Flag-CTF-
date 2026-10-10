/**
 * Short canvas burst for a correct flag. No DOM nodes per particle.
 * Callers must skip this when reduced motion or ambient effects are off.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const COLORS = ["#f2b544", "#3fbf7f", "#e7eef4", "#56a8e5"];

export function burstConfetti(origin: { x: number; y: number }): () => void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "75";
  document.body.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return () => undefined;
  }

  const particles: Particle[] = Array.from({ length: 48 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
      size: 3 + Math.random() * 3,
    };
  });

  let frame = 0;
  let stopped = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  function tick() {
    if (stopped || !context) return;
    if (document.hidden) {
      frame = requestAnimationFrame(tick);
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const particle of particles) {
      particle.life -= 0.016;
      if (particle.life <= 0) continue;
      alive = true;
      particle.vy += 0.08;
      particle.x += particle.vx;
      particle.y += particle.vy;
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size * 0.6);
    }
    context.globalAlpha = 1;
    if (alive) frame = requestAnimationFrame(tick);
    else cleanup();
  }

  function cleanup() {
    stopped = true;
    cancelAnimationFrame(frame);
    canvas.remove();
    window.removeEventListener("resize", resize);
  }

  window.addEventListener("resize", resize);
  frame = requestAnimationFrame(tick);
  return cleanup;
}
