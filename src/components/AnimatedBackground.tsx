import { useEffect, useRef } from "react";
import type { BgStyle } from "@/components/BackgroundPicker";

interface AnimatedBackgroundProps {
  style: BgStyle;
}

export default function AnimatedBackground({ style }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle data
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; phase: number };
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;

      if (style === "rain") {
        for (let i = 0; i < 120; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -1,
            vy: 8 + Math.random() * 6,
            size: 1 + Math.random() * 1.5,
            opacity: 0.15 + Math.random() * 0.2,
            phase: 0,
          });
        }
      } else if (style === "clouds") {
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: Math.random() * w,
            y: 50 + Math.random() * (h * 0.6),
            vx: 0.2 + Math.random() * 0.3,
            vy: 0,
            size: 60 + Math.random() * 80,
            opacity: 0.04 + Math.random() * 0.04,
            phase: Math.random() * Math.PI * 2,
          });
        }
      } else if (style === "stars") {
        for (let i = 0; i < 60; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 0,
            vy: 0,
            size: 1 + Math.random() * 2,
            opacity: 0.1 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
          });
        }
      } else if (style === "waves") {
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: 0,
            y: h * 0.3 + i * (h * 0.15),
            vx: 0,
            vy: 0,
            size: 0,
            opacity: 0.04 + i * 0.01,
            phase: i * 0.8,
          });
        }
      }
    };

    initParticles();
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      if (style === "rain") {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
          if (p.x < 0) p.x = canvas.width;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y - p.vy * 1.5);
          ctx.strokeStyle = `hsla(210, 40%, 60%, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.stroke();
        });
      } else if (style === "clouds") {
        particles.forEach((p) => {
          p.x += p.vx;
          if (p.x > canvas.width + p.size) p.x = -p.size;
          const wobble = Math.sin(time * 0.5 + p.phase) * 5;

          ctx.beginPath();
          ctx.ellipse(p.x, p.y + wobble, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(210, 20%, 70%, ${p.opacity})`;
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(p.x - p.size * 0.3, p.y + wobble + 5, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(p.x + p.size * 0.35, p.y + wobble + 3, p.size * 0.6, p.size * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (style === "stars") {
        particles.forEach((p) => {
          const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + p.phase);
          const currentOpacity = p.opacity * twinkle;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(45, 60%, 70%, ${currentOpacity})`;
          ctx.fill();

          // Cross sparkle
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 2, p.y);
          ctx.lineTo(p.x + p.size * 2, p.y);
          ctx.moveTo(p.x, p.y - p.size * 2);
          ctx.lineTo(p.x, p.y + p.size * 2);
          ctx.strokeStyle = `hsla(45, 60%, 70%, ${currentOpacity * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      } else if (style === "waves") {
        particles.forEach((p) => {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 4) {
            const waveY = p.y + Math.sin((x * 0.008) + time * 1.2 + p.phase) * 30 + Math.sin((x * 0.015) + time * 0.8 + p.phase * 2) * 15;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fillStyle = `hsla(200, 50%, 70%, ${p.opacity})`;
          ctx.fill();
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    if (style === "rain" || style === "clouds" || style === "stars" || style === "waves") {
      animate();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [style]);

  // Static backgrounds
  if (style === "dots") {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    );
  }

  if (style === "grid") {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
    );
  }

  // Canvas-based animated backgrounds
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
