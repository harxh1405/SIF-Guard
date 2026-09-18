import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  baseAlpha: number;
  currentAlpha: number;
  luminance: number; // 0 (dim) to 1 (bright white)
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  driftPhase: number;
  modeWeight: number; // 0: vortex, 1: dispersed matrix, 2: horizontal wave
}

interface ParticleFieldCanvasProps {
  className?: string;
  intensity?: number;
}

/**
 * Frame-Accurate Particle Animation Engine based on reference visual direction:
 * - Frame 1: Concentrated luminous elliptical vortex / cluster with intense white core.
 * - Frame 2: Dispersed granular matrix / digital phosphor grain across viewport.
 * - Frame 3: Luminous horizontal wave / plasma flow across typography following cursor.
 * - Ultra-high performance: 60fps canvas rendering using microscopic particulate rectangles with additive glow.
 */
export const ParticleFieldCanvas: React.FC<ParticleFieldCanvasProps> = ({
  className = '',
  intensity = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Viewport-adaptive particle density
    const isMobile = width < 768;
    const particleCount = prefersReducedMotion
      ? 400
      : isMobile
      ? 1200
      : Math.min(Math.floor((width * height) / 480), 3600);

    const setupDimensions = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupDimensions();

    // Mouse & interaction tracking
    let targetMouseX = width * 0.42;
    let targetMouseY = height * 0.16;
    let mouseX = targetMouseX;
    let mouseY = targetMouseY;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let mouseSpeed = 0;
    let lastMouseMoveTime = performance.now();

    // Animation cycle state: 0 (vortex cluster) -> 1 (horizontal stream) -> 2 (dispersed matrix)
    let globalTime = 0;
    let activeMode = 0; // 0: cluster (Frame 1), 1: stream/wave (Frame 3), 2: dispersed (Frame 2)
    let modeTransition = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      lastMouseMoveTime = performance.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
        lastMouseMoveTime = performance.now();
      }
    };

    const handleResize = () => {
      setupDimensions();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Initialize particle pool
    const particles: Particle[] = new Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const isCore = i < particleCount * 0.35; // 35% particles cluster tightly in vortex/wave
      const isMid = !isCore && i < particleCount * 0.7; // 35% medium envelope

      // Aspect ratio variation: square to small rectangular phosphor grain
      const aspect = 1.0 + Math.random() * 0.8;
      const size = isCore
        ? 1.2 + Math.random() * 1.6
        : isMid
        ? 1.0 + Math.random() * 1.2
        : 0.8 + Math.random() * 1.0;

      const angle = Math.random() * Math.PI * 2;
      const radius = isCore
        ? Math.pow(Math.random(), 1.6) * 120
        : isMid
        ? 80 + Math.random() * 220
        : Math.random() * Math.max(width, height);

      particles[i] = {
        x: targetMouseX + Math.cos(angle) * radius * 1.6,
        y: targetMouseY + Math.sin(angle) * radius * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size,
        aspect,
        baseAlpha: isCore
          ? 0.7 + Math.random() * 0.3
          : isMid
          ? 0.35 + Math.random() * 0.4
          : 0.12 + Math.random() * 0.28,
        currentAlpha: 0,
        luminance: isCore ? 0.95 : isMid ? 0.65 : 0.35,
        orbitAngle: angle,
        orbitRadius: radius,
        orbitSpeed: (0.008 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
        driftPhase: Math.random() * Math.PI * 2,
        modeWeight: Math.random(),
      };
    }

    // Main animation loop
    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      if (document.hidden) return;

      globalTime += 0.016;

      // Calculate mouse speed and smooth tracking
      const dx = targetMouseX - mouseX;
      const dy = targetMouseY - mouseY;
      mouseX += dx * 0.08;
      mouseY += dy * 0.08;

      const instSpeed = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
      mouseSpeed = mouseSpeed * 0.92 + instSpeed * 0.08;
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      // Determine interactive mode based on mouse speed & activity
      // Frame 1: Low speed hovering near anchor -> Vortex Cluster
      // Frame 3: Medium/Fast horizontal motion across text -> Luminous Horizontal Wave
      // Frame 2: Idle or leaving -> Dispersed Ambient Matrix
      const timeSinceMouseMove = now - lastMouseMoveTime;
      if (mouseSpeed > 4.5) {
        // Fast swipe -> Frame 3 Luminous Stream Wave
        activeMode = 1;
        modeTransition += (1 - modeTransition) * 0.06;
      } else if (timeSinceMouseMove > 4000) {
        // Idle for >4s -> Frame 2 Dispersed Granular Matrix
        activeMode = 2;
        modeTransition += (0 - modeTransition) * 0.04;
      } else {
        // Normal hovering -> Frame 1 Concentrated Elliptical Vortex
        activeMode = 0;
        modeTransition += (0.4 - modeTransition) * 0.05;
      }

      // Clear with slight motion blur decay or transparent wipe
      ctx.clearRect(0, 0, width, height);

      // Additive blending for luminous core effect
      ctx.globalCompositeOperation = 'lighter';

      // Draw subtle luminous aura at cluster focal point (Frame 1 / Frame 3 core)
      if (modeTransition < 0.85) {
        const auraAlpha = Math.max(0.04, (1 - modeTransition) * 0.16 * intensity);
        const grad = ctx.createRadialGradient(
          mouseX,
          mouseY,
          4,
          mouseX,
          mouseY,
          activeMode === 1 ? 260 : 140
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${auraAlpha * 1.8})`);
        grad.addColorStop(0.3, `rgba(220, 230, 245, ${auraAlpha * 0.8})`);
        grad.addColorStop(0.7, `rgba(180, 200, 225, ${auraAlpha * 0.25})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (activeMode === 1) {
          // Horizontal elongated glow for Frame 3
          ctx.ellipse(mouseX, mouseY, 320, 90, 0, 0, Math.PI * 2);
        } else {
          // Elliptical glow for Frame 1
          ctx.ellipse(mouseX, mouseY, 160, 80, -0.15, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Update and render particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        // 1. Vortex Cluster Dynamics (Frame 1)
        p.orbitAngle += p.orbitSpeed;
        p.driftPhase += 0.02;

        // Elliptical rotation around focal point
        const clusterTargetX = mouseX + Math.cos(p.orbitAngle) * p.orbitRadius * 1.5;
        const clusterTargetY =
          mouseY +
          Math.sin(p.orbitAngle) * p.orbitRadius * 0.55 +
          Math.sin(p.driftPhase + p.orbitRadius * 0.05) * 6;

        // 2. Luminous Horizontal Wave Dynamics (Frame 3)
        // High density horizontal band sweeping across viewport around mouseY
        const waveXSpread = (Math.sin(p.driftPhase * 0.5 + i * 0.01) * 0.5 + 0.5) * (width * 0.7);
        const waveYOffset = (Math.sin(p.orbitAngle * 2 + globalTime * 2) * 35) * Math.pow(Math.random(), 0.8);
        const waveTargetX = Math.max(40, Math.min(width - 40, mouseX - width * 0.35 + waveXSpread));
        const waveTargetY = mouseY + waveYOffset;

        // 3. Dispersed Matrix Field Dynamics (Frame 2)
        // Shimmering uniform grain covering whole screen with subtle Brownian vibration
        const matrixTargetX = (p.x + p.vx * 1.8 + width) % width;
        const matrixTargetY = (p.y + p.vy * 1.8 + height) % height;

        // Interpolate target position based on activeMode and modeTransition
        let destX: number;
        let destY: number;

        if (activeMode === 1) {
          // Blending towards Frame 3 Horizontal Wave
          const w1 = p.modeWeight;
          destX = clusterTargetX * (1 - w1) + waveTargetX * w1;
          destY = clusterTargetY * (1 - w1) + waveTargetY * w1;
        } else if (activeMode === 2) {
          // Blending towards Frame 2 Dispersed Matrix
          destX = matrixTargetX;
          destY = matrixTargetY;
        } else {
          // Frame 1 Concentrated Elliptical Vortex
          destX = clusterTargetX;
          destY = clusterTargetY;
        }

        // Smooth physics relaxation towards destination
        const spring = p.modeWeight > 0.7 ? 0.04 : 0.09;
        p.x += (destX - p.x) * spring;
        p.y += (destY - p.y) * spring;

        // Proximity to cursor enhances luminescence and alpha
        const distToMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
        const proximityBoost = Math.max(0, 1 - distToMouse / 280);

        // Alpha calculation
        const shimmer = Math.sin(globalTime * 3 + p.driftPhase) * 0.15;
        const targetAlpha = Math.min(
          1.0,
          p.baseAlpha * intensity + proximityBoost * 0.5 + shimmer
        );
        p.currentAlpha += (targetAlpha - p.currentAlpha) * 0.1;

        if (p.currentAlpha <= 0.01) continue;

        // Color & Luminance: pure crisp whites, titanium silver, subtle celestial blue glint
        const r = Math.floor(220 + p.luminance * 35);
        const g = Math.floor(228 + p.luminance * 27);
        const b = Math.floor(242 + p.luminance * 13);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.currentAlpha})`;

        // Microscopic rectangular phosphor particle render
        const pw = Math.max(1, p.size * p.aspect);
        const ph = Math.max(1, p.size);
        ctx.fillRect(p.x - pw * 0.5, p.y - ph * 0.5, pw, ph);
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
};
