import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 120;
const PARTICLE_SIZE_MIN = 1.2; // Increased for visibility
const PARTICLE_SIZE_MAX = 2.2; // Increased for visibility
const SPEED = 0.08;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function getColor(isDark: boolean) {
  // Always blue in light mode, white in dark mode
  return isDark ? "rgba(255,255,255,0.7)" : "rgba(59,130,246,0.9)"; // #3B82F6
}

const SparklesCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particles = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Detect dark mode using Tailwind's class on <html>
    const isDark = document.documentElement.classList.contains("dark");

    // Initialize particles
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: randomBetween(PARTICLE_SIZE_MIN, PARTICLE_SIZE_MAX),
      dx: randomBetween(-SPEED, SPEED),
      dy: randomBetween(-SPEED, SPEED),
    }));

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let p of particles.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = getColor(isDark);
        ctx.shadowColor = getColor(isDark);
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        p.x += p.dx;
        p.y += p.dy;
        // Wrap around
        if (p.x < 0) p.x += width;
        if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        if (p.y > height) p.y -= height;
      }
      animationRef.current = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default SparklesCanvas; 