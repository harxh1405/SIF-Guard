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

interface TwilightStream {
  yRatio: number;
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  isOrange: boolean;
}

interface AmbientTelemetryCanvasProps {
  theme?: 'light' | 'dark';
}

/**
 * Ultra-High-Performance Industrial Background Canvas.
 * Combines Perspective Grid, Twilight Lines, and Neural Float telemetry nodes.
 * Features:
 * - Direct batched canvas draws without expensive ctx.shadowBlur or save/restore stalls.
 * - Throttled mouse parallax running in pure RAF with lerping.
 * - Automatic pause when tab is hidden or backgrounded.
 * - Respects prefers-reduced-motion.
 * - Full Dark (#050505) and Warm Light (#F5F2EB) mode compatibility.
 */
export const AmbientTelemetryCanvas: React.FC<AmbientTelemetryCanvasProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef<'light' | 'dark'>(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking for subtle parallax
    let targetMouseX = width * 0.5;
    let targetMouseY = height * 0.5;
    let mouseX = targetMouseX;
    let mouseY = targetMouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initialize Neural Float Particles (36 nodes - lightweight and crisp)
    const particleCount = 36;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isOrange = Math.random() < 0.2; // 20% orange, 80% silver/gray
      const randR = Math.random();
      const radius = randR < 0.6 ? 0.9 : randR < 0.9 ? 1.5 : 2.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12 - 0.02, // slight upward rising bias
        radius,
        baseAlpha: 0.18 + Math.random() * 0.22,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        isOrange,
      });
    }

    // Initialize Twilight Curvilinear Telemetry Streams
    const twilightStreams: TwilightStream[] = [
      { yRatio: 0.22, amplitude: 32, frequency: 0.0018, phase: 0, speed: 0.003, isOrange: true },
      { yRatio: 0.55, amplitude: 44, frequency: 0.0014, phase: 2.1, speed: 0.0025, isOrange: false },
      { yRatio: 0.82, amplitude: 38, frequency: 0.0020, phase: 4.3, speed: 0.0035, isOrange: true },
    ];

    // Static render for reduced motion
    const renderStatic = () => {
      const isLight = themeRef.current === 'light';
      ctx.clearRect(0, 0, width, height);

      // Draw faint coordinate ticks
      const gridStep = 140;
      ctx.fillStyle = isLight ? 'rgba(36, 32, 28, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.font = '9px monospace';
      for (let x = gridStep; x < width; x += gridStep) {
        for (let y = gridStep; y < height; y += gridStep) {
          ctx.fillText('+', x - 3, y + 3);
        }
      }

      // Draw static particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? (p.isOrange ? 'rgba(230, 95, 0, 0.35)' : 'rgba(90, 80, 72, 0.25)')
          : (p.isOrange ? 'rgba(255, 115, 0, 0.45)' : 'rgba(180, 172, 164, 0.3)');
        ctx.fill();
      }
    };

    if (prefersReducedMotion) {
      renderStatic();
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (resizeTimer) clearTimeout(resizeTimer);
      };
    }

    const render = () => {
      animId = requestAnimationFrame(render);
      if (document.hidden) return;

      const isLight = themeRef.current === 'light';

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const mouseNormX = (mouseX / width - 0.5) * 10;
      const mouseNormY = (mouseY / height - 0.5) * 10;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Perspective Grid Coordinate Crosshairs (Batched)
      const gridStep = 140;
      ctx.fillStyle = isLight ? 'rgba(36, 32, 28, 0.06)' : 'rgba(255, 255, 255, 0.03)';
      ctx.font = '9px monospace';
      for (let gx = gridStep; gx < width; gx += gridStep) {
        const drawGX = gx + mouseNormX * 0.12;
        for (let gy = gridStep; gy < height; gy += gridStep) {
          const drawGY = gy + mouseNormY * 0.12;
          ctx.fillText('+', drawGX - 3, drawGY + 3);
        }
      }

      // 2. Draw Twilight Telemetry Streams
      for (let s = 0; s < twilightStreams.length; s++) {
        const stream = twilightStreams[s];
        stream.phase += stream.speed;

        ctx.beginPath();
        const baseY = height * stream.yRatio + mouseNormY * 0.3;
        ctx.moveTo(0, baseY + Math.sin(stream.phase) * stream.amplitude);

        for (let x = 0; x < width; x += 40) {
          const y = baseY + Math.sin(x * stream.frequency + stream.phase) * stream.amplitude;
          ctx.lineTo(x, y);
        }

        if (isLight) {
          ctx.strokeStyle = stream.isOrange
            ? 'rgba(230, 95, 0, 0.05)'
            : 'rgba(50, 42, 34, 0.035)';
        } else {
          ctx.strokeStyle = stream.isOrange
            ? 'rgba(255, 115, 0, 0.07)'
            : 'rgba(255, 255, 255, 0.03)';
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Draw Connecting Lines (Pre-calculated distance squared < 10000 = 100px)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const draw1X = p1.x + mouseNormX * (p1.radius * 0.3);
        const draw1Y = p1.y + mouseNormY * (p1.radius * 0.3);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 10000) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = 1 - dist / 100;
            const draw2X = p2.x + mouseNormX * (p2.radius * 0.3);
            const draw2Y = p2.y + mouseNormY * (p2.radius * 0.3);

            ctx.beginPath();
            ctx.moveTo(draw1X, draw1Y);
            ctx.lineTo(draw2X, draw2Y);

            if (isLight) {
              ctx.strokeStyle = p1.isOrange || p2.isOrange
                ? `rgba(230, 95, 0, ${lineAlpha * 0.12})`
                : `rgba(100, 90, 80, ${lineAlpha * 0.06})`;
            } else {
              ctx.strokeStyle = p1.isOrange || p2.isOrange
                ? `rgba(255, 115, 0, ${lineAlpha * 0.14})`
                : `rgba(210, 202, 194, ${lineAlpha * 0.06})`;
            }
            ctx.lineWidth = p1.isOrange || p2.isOrange ? 0.75 : 0.5;
            ctx.stroke();
          }
        }
      }

      // 4. Draw Particle Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        // Wrap edges
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;
        if (p.y < -15) p.y = height + 15;
        if (p.y > height + 15) p.y = -15;

        // Parallax displacement
        const drawX = p.x + mouseNormX * (p.radius * 0.3);
        const drawY = p.y + mouseNormY * (p.radius * 0.3);

        const pulse = Math.sin(p.pulsePhase) * 0.05;
        const alpha = Math.max(0.12, Math.min(0.5, p.baseAlpha + pulse));

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        if (isLight) {
          ctx.fillStyle = p.isOrange
            ? `rgba(230, 95, 0, ${alpha * 0.85})`
            : `rgba(90, 80, 72, ${alpha * 0.55})`;
        } else {
          ctx.fillStyle = p.isOrange
            ? `rgba(255, 125, 10, ${alpha * 0.95})`
            : `rgba(180, 172, 164, ${alpha * 0.65})`;
        }
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default AmbientTelemetryCanvas;
