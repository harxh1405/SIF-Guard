import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  isOrange: boolean;
}

interface TelemetryStream {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  progress: number;
  speed: number;
}

export const AmbientTelemetryCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for subtle parallax
    let targetMouseX = width * 0.5;
    let targetMouseY = height * 0.5;
    let mouseX = targetMouseX;
    let mouseY = targetMouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initialize 50-60 organized industrial telemetry particles
    const particleCount = Math.min(Math.floor(width / 24), 60);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25 - 0.05, // very gentle upward draft
        radius: Math.random() > 0.85 ? 2.2 : Math.random() > 0.5 ? 1.6 : 1.1,
        baseAlpha: 0.1 + Math.random() * 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        isOrange: Math.random() < 0.2, // 20% safety orange, 80% warm neutral
      });
    }

    // Initialize 3 subtle curved telemetry stream paths
    const streams: TelemetryStream[] = [
      {
        p0: { x: width * 0.65, y: height * 0.3 },
        p1: { x: width * 0.5, y: height * 0.2 },
        p2: { x: width * 0.1, y: height * 0.35 },
        progress: 0.1,
        speed: 0.0012,
      },
      {
        p0: { x: width * 0.75, y: height * 0.5 },
        p1: { x: width * 0.55, y: height * 0.65 },
        p2: { x: width * 0.2, y: height * 0.75 },
        progress: 0.5,
        speed: 0.0009,
      },
      {
        p0: { x: width * 0.6, y: height * 0.4 },
        p1: { x: width * 0.45, y: height * 0.45 },
        p2: { x: width * 0.05, y: height * 0.55 },
        progress: 0.8,
        speed: 0.0015,
      },
    ];

    const render = () => {
      animId = requestAnimationFrame(render);
      if (document.hidden) return;

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const mouseNormX = (mouseX / width - 0.5) * 16;
      const mouseNormY = (mouseY / height - 0.5) * 16;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle curved telemetry streams
      streams.forEach((stream) => {
        stream.progress += stream.speed;
        if (stream.progress > 1) stream.progress = 0;

        // Draw faint guide path
        ctx.beginPath();
        ctx.moveTo(stream.p0.x, stream.p0.y);
        ctx.quadraticCurveTo(stream.p1.x, stream.p1.y, stream.p2.x, stream.p2.y);
        ctx.strokeStyle = 'rgba(255, 106, 0, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw moving packet point
        const t = stream.progress;
        const qx = (1 - t) * (1 - t) * stream.p0.x + 2 * (1 - t) * t * stream.p1.x + t * t * stream.p2.x;
        const qy = (1 - t) * (1 - t) * stream.p0.y + 2 * (1 - t) * t * stream.p1.y + t * t * stream.p2.y;

        ctx.beginPath();
        ctx.arc(qx, qy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 106, 0, 0.4)';
        ctx.shadowColor = '#FF6A00';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Draw telemetry particles and faint connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        // Wrap edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Subtle parallax displacement
        const drawX = p.x + mouseNormX * (p.radius * 0.4);
        const drawY = p.y + mouseNormY * (p.radius * 0.4);

        // Alpha calculation with gentle pulse
        const pulse = Math.sin(p.pulsePhase) * 0.12;
        const alpha = Math.max(0.04, Math.min(0.5, p.baseAlpha + pulse));

        // Render point
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isOrange
          ? `rgba(255, 106, 0, ${alpha * 1.2})`
          : `rgba(179, 161, 148, ${alpha})`;
        ctx.fill();

        // Connect with nearby particles if distance < 110px
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 12000) {
            // ~110px
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / 110) * 0.07;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(p2.x + mouseNormX * (p2.radius * 0.4), p2.y + mouseNormY * (p2.radius * 0.4));
            ctx.strokeStyle = p.isOrange || p2.isOrange
              ? `rgba(255, 106, 0, ${lineAlpha * 1.5})`
              : `rgba(82, 67, 56, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default AmbientTelemetryCanvas;
