import { useEffect, useRef } from "react";
import type { BgStyle } from "@/components/BackgroundPicker";

interface AnimatedBackgroundProps {
  style: BgStyle;
}

type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number; phase: number; color?: string; rotation?: number; rotationSpeed?: number; emoji?: string };

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

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;

      if (style === "rain") {
        for (let i = 0; i < 120; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: -1, vy: 8 + Math.random() * 6, size: 1 + Math.random() * 1.5, opacity: 0.15 + Math.random() * 0.2, phase: 0 });
        }
      } else if (style === "clouds") {
        for (let i = 0; i < 8; i++) {
          particles.push({ x: Math.random() * w, y: 50 + Math.random() * (h * 0.6), vx: 0.2 + Math.random() * 0.3, vy: 0, size: 60 + Math.random() * 80, opacity: 0.04 + Math.random() * 0.04, phase: Math.random() * Math.PI * 2 });
        }
      } else if (style === "waves") {
        for (let i = 0; i < 5; i++) {
          particles.push({ x: 0, y: h * 0.3 + i * (h * 0.15), vx: 0, vy: 0, size: 0, opacity: 0.04 + i * 0.01, phase: i * 0.8 });
        }
      } else if (style === "snow") {
        for (let i = 0; i < 80; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: 1 + Math.random() * 2, size: 2 + Math.random() * 4, opacity: 0.3 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2 });
        }
      } else if (style === "confetti") {
        const confettiColors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b9d", "#c084fc", "#fb923c"];
        for (let i = 0; i < 50; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 2, size: 4 + Math.random() * 6, opacity: 0.6 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2, color: confettiColors[Math.floor(Math.random() * confettiColors.length)], rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 6 });
        }
      } else if (style === "aurora") {
        for (let i = 0; i < 6; i++) {
          particles.push({ x: 0, y: h * 0.15 + i * (h * 0.08), vx: 0, vy: 0, size: 0, opacity: 0.06, phase: i * 1.2, color: i % 3 === 0 ? "120, 80%" : i % 3 === 1 ? "200, 70%" : "280, 60%" });
        }
      } else if (style === "hearts") {
        for (let i = 0; i < 25; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: -(0.5 + Math.random() * 1.5), size: 8 + Math.random() * 14, opacity: 0.15 + Math.random() * 0.25, phase: Math.random() * Math.PI * 2, color: ["#ff6b9d", "#ff4081", "#e91e63", "#f48fb1", "#ff80ab"][Math.floor(Math.random() * 5)] });
        }
      } else if (style === "flowers") {
        const flowerEmojis = ["🌸", "🌺", "🌻", "🌷", "🌹", "💮", "🏵️", "🌼"];
        for (let i = 0; i < 20; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: 0.5 + Math.random() * 1, size: 14 + Math.random() * 12, opacity: 0.5 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 1, emoji: flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)] });
        }
      }
    };

    initParticles();
    let time = 0;

    const drawHeart = (cx: number, cy: number, size: number, color: string, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      const s = size / 16;
      ctx.moveTo(cx, cy + s * 4);
      ctx.bezierCurveTo(cx, cy + s * 2, cx - s * 8, cy - s * 4, cx, cy - s * 8);
      ctx.bezierCurveTo(cx + s * 8, cy - s * 4, cx, cy + s * 2, cx, cy + s * 4);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      if (style === "rain") {
        particles.forEach((p) => {
          p.x += p.vx; p.y += p.vy;
          if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
          if (p.x < 0) p.x = canvas.width;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y - p.vy * 1.5);
          ctx.strokeStyle = `hsla(210, 40%, 60%, ${p.opacity})`; ctx.lineWidth = p.size; ctx.lineCap = "round"; ctx.stroke();
        });
      } else if (style === "clouds") {
        particles.forEach((p) => {
          p.x += p.vx; if (p.x > canvas.width + p.size) p.x = -p.size;
          const wobble = Math.sin(time * 0.5 + p.phase) * 5;
          ctx.fillStyle = `hsla(210, 20%, 70%, ${p.opacity})`;
          ctx.beginPath(); ctx.ellipse(p.x, p.y + wobble, p.size, p.size * 0.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(p.x - p.size * 0.3, p.y + wobble + 5, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(p.x + p.size * 0.35, p.y + wobble + 3, p.size * 0.6, p.size * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        });
      } else if (style === "waves") {
        particles.forEach((p) => {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 4) {
            const waveY = p.y + Math.sin(x * 0.008 + time * 1.2 + p.phase) * 30 + Math.sin(x * 0.015 + time * 0.8 + p.phase * 2) * 15;
            if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
          }
          ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath();
          ctx.fillStyle = `hsla(200, 50%, 70%, ${p.opacity})`; ctx.fill();
        });
      } else if (style === "snow") {
        particles.forEach((p) => {
          p.x += p.vx + Math.sin(time + p.phase) * 0.3;
          p.y += p.vy;
          if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(210, 30%, 95%, ${p.opacity})`; ctx.fill();
          // Soft glow
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(210, 30%, 95%, ${p.opacity * 0.2})`; ctx.fill();
        });
      } else if (style === "confetti") {
        particles.forEach((p) => {
          p.x += p.vx; p.y += p.vy;
          p.rotation! += p.rotationSpeed!;
          p.vx += (Math.random() - 0.5) * 0.1;
          if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation! * Math.PI) / 180);
          ctx.fillStyle = p.color!; ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        });
      } else if (style === "aurora") {
        particles.forEach((p) => {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 3) {
            const waveY = p.y + Math.sin(x * 0.003 + time * 0.4 + p.phase) * 60 + Math.sin(x * 0.007 + time * 0.7 + p.phase * 1.5) * 30;
            if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
          }
          ctx.lineTo(canvas.width, p.y + 150); ctx.lineTo(0, p.y + 150); ctx.closePath();
          const grad = ctx.createLinearGradient(0, p.y - 60, 0, p.y + 150);
          grad.addColorStop(0, `hsla(${p.color!}, 0%)`);
          grad.addColorStop(0.3, `hsla(${p.color!}, ${p.opacity})`);
          grad.addColorStop(0.7, `hsla(${p.color!}, ${p.opacity * 0.5})`);
          grad.addColorStop(1, `hsla(${p.color!}, 0%)`);
          ctx.fillStyle = grad; ctx.fill();
        });
      } else if (style === "hearts") {
        particles.forEach((p) => {
          p.x += p.vx + Math.sin(time * 1.5 + p.phase) * 0.3;
          p.y += p.vy;
          if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
          const pulse = 1 + 0.1 * Math.sin(time * 3 + p.phase);
          drawHeart(p.x, p.y, p.size * pulse, p.color!, p.opacity);
        });
      } else if (style === "flowers") {
        particles.forEach((p) => {
          p.x += p.vx + Math.sin(time * 0.8 + p.phase) * 0.2;
          p.y += p.vy;
          p.rotation! += p.rotationSpeed!;
          if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
          ctx.save(); ctx.translate(p.x, p.y);
          ctx.globalAlpha = p.opacity;
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(p.emoji!, 0, 0);
          ctx.restore();
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [style]);

  // Static grid background
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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
