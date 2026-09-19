import React, { useEffect, useRef } from 'react';

interface CinematicBackgroundProps {
  theme?: 'dark' | 'light';
}

// Module-level timestamp to guarantee emergence runs ONCE per page load
// and NEVER restarts on React re-renders, scrolling, mouse movement, or resizing.
const pageEntryTimestamp = performance.now();

export const CinematicBackground: React.FC<CinematicBackgroundProps> = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let isVisible = !document.hidden;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // =========================================================================
    // PARTICLE POPULATION COUNTS
    // Population A: Hero Particle River & Vortex (~50,000 particles on desktop)
    // Population B: Atmospheric Floating Oil/Mist Rain (~5,000 particles on desktop)
    // =========================================================================
    const RIVER_N = prefersReducedMotion
      ? 8000
      : width > 1024
      ? 50000
      : width > 640
      ? 32000
      : 16000;

    const RAIN_N = prefersReducedMotion
      ? 800
      : width > 1024
      ? 5000
      : width > 640
      ? 3000
      : 1500;

    const TOTAL_N = RIVER_N + RAIN_N;

    // Sub-allocations for River Population:
    // ~58% Main River Body (~29,000 on desktop)
    // ~30% One Broad Spiral Vortex (~15,000 on desktop, centered at X ≈ 63%, Y ≈ 74%)
    // ~12% Secondary Atmospheric Wisps / Soft Outer Drift (~6,000 on desktop)
    const MAIN_COUNT = Math.floor(RIVER_N * 0.58);
    const VORTEX_COUNT = Math.floor(RIVER_N * 0.30);
    const WISP_COUNT = RIVER_N - (MAIN_COUNT + VORTEX_COUNT);

    // -------------------------------------------------------------------------
    // WEBGL CONTEXT SETUP WITH HARDWARE FIRST-PAINT PROTECTION
    // -------------------------------------------------------------------------
    let gl = canvas.getContext('webgl', {
      alpha: false, // OPAQUE: Eliminates any white flash through from browser defaults
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    }) as WebGLRenderingContext | null;

    if (!gl) {
      gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    }

    const vsSource = `
      precision highp float;
      attribute vec2 a_pos;
      attribute float a_size;
      attribute float a_alpha;
      attribute vec3 a_color;

      uniform vec2 u_resolution;

      varying vec4 v_color;

      void main() {
        vec2 zeroToOne = a_pos / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = vec2(zeroToTwo.x - 1.0, 1.0 - zeroToTwo.y);

        gl_Position = vec4(clipSpace, 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = vec4(a_color, a_alpha);
      }
    `;

    // Soft circular Gaussian falloff with subtle luminous core - eliminates square box pixels
    const fsSource = `
      precision highp float;
      varying vec4 v_color;

      void main() {
        vec2 coord = (gl_PointCoord - vec2(0.5)) * 2.0;
        float dist = length(coord);
        if (dist > 1.0) discard;

        // Soft circular Gaussian falloff with luminous center
        float alpha = exp(-dist * dist * 3.4) * smoothstep(1.0, 0.18, dist);
        if (alpha <= 0.008) discard;

        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;

    let program: WebGLProgram | null = null;
    let posBuffer: WebGLBuffer | null = null;
    let sizeBuffer: WebGLBuffer | null = null;
    let alphaBuffer: WebGLBuffer | null = null;
    let colorBuffer: WebGLBuffer | null = null;

    let uResLocation: WebGLUniformLocation | null = null;
    let aPosLocation = -1;
    let aSizeLocation = -1;
    let aAlphaLocation = -1;
    let aColorLocation = -1;

    const initWebGL = () => {
      if (!gl) return false;

      const vShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vShader) return false;
      gl.shaderSource(vShader, vsSource);
      gl.compileShader(vShader);

      const fShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fShader) return false;
      gl.shaderSource(fShader, fsSource);
      gl.compileShader(fShader);

      program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vShader);
      gl.attachShader(program, fShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return false;
      }

      gl.useProgram(program);

      uResLocation = gl.getUniformLocation(program, 'u_resolution');
      aPosLocation = gl.getAttribLocation(program, 'a_pos');
      aSizeLocation = gl.getAttribLocation(program, 'a_size');
      aAlphaLocation = gl.getAttribLocation(program, 'a_alpha');
      aColorLocation = gl.getAttribLocation(program, 'a_color');

      posBuffer = gl.createBuffer();
      sizeBuffer = gl.createBuffer();
      alphaBuffer = gl.createBuffer();
      colorBuffer = gl.createBuffer();

      // Standard alpha blending (prevents bloom white-out)
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.DEPTH_TEST);

      // SYNCHRONOUS INITIAL CLEAR TO #0B0C0E (11, 12, 14) ON MOUNT (Guarantees zero white flash)
      gl.clearColor(0.0431, 0.0471, 0.0549, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return true;
    };

    initWebGL();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0431, 0.0471, 0.0549, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // -------------------------------------------------------------------------
    // RIVER SPLINE & VORTEX ANCHORS (Confined to Lower Hero: Y = 55% -> 95%)
    // -------------------------------------------------------------------------
    const getRiverCenterY = (normX: number, h: number): number => {
      const base =
        0.76 +
        0.050 * Math.sin(normX * Math.PI * 1.6 - 0.3) +
        0.030 * Math.cos(normX * Math.PI * 2.7 + 0.4) -
        0.035 * Math.sin((normX - 0.42) * Math.PI * 2.0);
      return base * h;
    };

    const VORTEX_NORM_X = 0.63;
    const VORTEX_NORM_Y = 0.74;

    // Helper: Box-Muller Gaussian random variable generator
    const gaussianRandom = (): number => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    // -------------------------------------------------------------------------
    // MEMORY BUFFERS & TYPED ARRAYS (Reused every frame, zero GC allocation)
    // -------------------------------------------------------------------------
    const pPopType = new Int8Array(TOTAL_N);
    const pSeed = new Float32Array(TOTAL_N);
    const pDepth = new Float32Array(TOTAL_N);
    const pBaseSize = new Float32Array(TOTAL_N);
    const pBaseAlpha = new Float32Array(TOTAL_N);
    const pColors = new Float32Array(TOTAL_N * 3);

    // Dynamic state arrays for river flow & vortex
    const pU = new Float32Array(TOTAL_N);
    const pNormalOffset = new Float32Array(TOTAL_N);
    const pSpeed = new Float32Array(TOTAL_N);
    const pVortexRadius = new Float32Array(TOTAL_N);
    const pVortexAngle = new Float32Array(TOTAL_N);
    const pVortexSpeed = new Float32Array(TOTAL_N);
    const pVortexAspect = new Float32Array(TOTAL_N);

    // Asynchronous compound breathing parameters (individual frequencies & phases)
    const pBreathFreq1 = new Float32Array(TOTAL_N);
    const pBreathPhase1 = new Float32Array(TOTAL_N);
    const pBreathFreq2 = new Float32Array(TOTAL_N);
    const pBreathPhase2 = new Float32Array(TOTAL_N);
    const pEmergenceDelay = new Float32Array(TOTAL_N);

    // Fluid-like physical inertia state:
    // displacement (dispX, dispY) and velocity (dispVx, dispVy)
    const pSwirlSign = new Float32Array(TOTAL_N);
    const dispX = new Float32Array(TOTAL_N);
    const dispY = new Float32Array(TOTAL_N);
    const dispVx = new Float32Array(TOTAL_N);
    const dispVy = new Float32Array(TOTAL_N);

    // Dynamic state arrays for Population B: Floating Rain Droplets
    const pRainX = new Float32Array(RAIN_N);
    const pRainY = new Float32Array(RAIN_N);
    const pRainBaseVy = new Float32Array(RAIN_N);
    const pRainBaseVx = new Float32Array(RAIN_N);
    const pRainDriftFreq = new Float32Array(RAIN_N);
    const pRainDriftAmp = new Float32Array(RAIN_N);
    const pRainDriftPhase = new Float32Array(RAIN_N);
    const pRainZigZagFreq = new Float32Array(RAIN_N);
    const pRainZigZagAmp = new Float32Array(RAIN_N);
    const pRainDispX = new Float32Array(RAIN_N);
    const pRainDispY = new Float32Array(RAIN_N);
    const pRainDispVx = new Float32Array(RAIN_N);
    const pRainDispVy = new Float32Array(RAIN_N);

    // WebGL GPU upload buffers
    const gpuPositions = new Float32Array(TOTAL_N * 2);
    const gpuSizes = new Float32Array(TOTAL_N);
    const gpuAlphas = new Float32Array(TOTAL_N);

    // Monochrome warm-white technical dust palette (#FFFFFF, #F5F5F5, #E8E8E8, #D7D7D7)
    const darkPalette = [
      [1.0, 1.0, 1.0],        // Pure luminous white core
      [0.96, 0.96, 0.95],     // Warm white body
      [0.91, 0.91, 0.90],     // Soft ivory
      [0.85, 0.85, 0.84],     // Light technical gray
    ];

    // -------------------------------------------------------------------------
    // INITIALIZE PARTICLES (Gaussian Density, Multi-Layer Depth, Micro-Sizes)
    // -------------------------------------------------------------------------
    let pIdx = 0;

    // (1) Main River Stream (~58%)
    for (let i = 0; i < MAIN_COUNT; i++) {
      const idx = pIdx++;
      pPopType[idx] = 1;
      pSeed[idx] = Math.random() * 1000.0;
      pDepth[idx] = 0.35 + Math.random() * 0.65;

      // Uniform initial distribution along river longitudinal coordinate
      pU[idx] = (i / MAIN_COUNT) + (Math.random() - 0.5) * (1.0 / MAIN_COUNT);
      if (pU[idx] < 0) pU[idx] += 1.0;
      if (pU[idx] > 1.0) pU[idx] -= 1.0;

      // Smooth Gaussian-style cross-sectional density distribution:
      // Peak concentration at centerline, tapering softly outward to eliminate hard edges
      const sigma = width > 768 ? 38.0 : 25.0;
      const clampedGauss = Math.max(-3.2, Math.min(3.2, gaussianRandom()));
      pNormalOffset[idx] = clampedGauss * sigma;

      // Individual fluid speeds avoiding conveyor-belt lockstep
      pSpeed[idx] = 0.014 + Math.random() * 0.019;

      // Exact individual particle size kept small and delicate (0.7px - 2.2px)
      const isCore = Math.abs(pNormalOffset[idx]) < sigma * 0.85;
      if (isCore) {
        pBaseSize[idx] = 0.9 + Math.random() * 1.3; // 0.9px - 2.2px
        pBaseAlpha[idx] = 0.34 + Math.random() * 0.32;
      } else {
        pBaseSize[idx] = 0.7 + Math.random() * 0.65; // 0.7px - 1.35px
        pBaseAlpha[idx] = 0.10 + Math.random() * 0.20;
      }

      // Asynchronous non-repeating breathing frequencies (periods ~25s - 55s & ~65s - 130s)
      pBreathFreq1[idx] = 0.11 + Math.random() * 0.13;
      pBreathPhase1[idx] = Math.random() * Math.PI * 2;
      pBreathFreq2[idx] = 0.045 + Math.random() * 0.055;
      pBreathPhase2[idx] = Math.random() * Math.PI * 2;

      pEmergenceDelay[idx] = Math.pow(Math.random(), 1.2) * 2.10; // Staggered 0.0s - 2.1s emergence
      pSwirlSign[idx] = Math.random() > 0.5 ? 1.0 : -1.0;

      const col = darkPalette[Math.floor(Math.random() * darkPalette.length)];
      pColors[idx * 3] = col[0];
      pColors[idx * 3 + 1] = col[1];
      pColors[idx * 3 + 2] = col[2];
    }

    // (2) One Broad Spiral Vortex (~30% - dense and rich around X ≈ 63%, Y ≈ 74%)
    for (let i = 0; i < VORTEX_COUNT; i++) {
      const idx = pIdx++;
      pPopType[idx] = 2;
      pSeed[idx] = Math.random() * 1000.0;
      pDepth[idx] = 0.40 + Math.random() * 0.60;

      const maxVortexR = width > 768 ? 220.0 : 150.0;
      // Power-curve radius distribution for rich dense core that feathers into river
      const rNorm = Math.pow(Math.random(), 1.75);
      pVortexRadius[idx] = 8.0 + rNorm * (maxVortexR - 8.0);
      pVortexAngle[idx] = Math.random() * Math.PI * 2;
      pVortexAspect[idx] = 1.45 + (Math.random() - 0.5) * 0.25;

      // Keplerian differential rotation: inner core swirls faster
      pVortexSpeed[idx] = 0.18 / (1.0 + Math.pow(pVortexRadius[idx] / 65.0, 0.82));

      const isCore = pVortexRadius[idx] < maxVortexR * 0.35;
      if (isCore) {
        pBaseSize[idx] = 1.0 + Math.random() * 1.2; // 1.0px - 2.2px
        pBaseAlpha[idx] = 0.38 + Math.random() * 0.30;
      } else {
        pBaseSize[idx] = 0.75 + Math.random() * 0.65;
        pBaseAlpha[idx] = 0.12 + Math.random() * 0.22;
      }

      pBreathFreq1[idx] = 0.12 + Math.random() * 0.12;
      pBreathPhase1[idx] = Math.random() * Math.PI * 2;
      pBreathFreq2[idx] = 0.05 + Math.random() * 0.05;
      pBreathPhase2[idx] = Math.random() * Math.PI * 2;

      pEmergenceDelay[idx] = Math.pow(Math.random(), 1.2) * 2.10;
      pSwirlSign[idx] = 1.0;

      const col = darkPalette[Math.floor(Math.random() * darkPalette.length)];
      pColors[idx * 3] = col[0];
      pColors[idx * 3 + 1] = col[1];
      pColors[idx * 3 + 2] = col[2];
    }

    // (3) Secondary Atmospheric Wisps Hugging River Margins (~12%)
    for (let i = 0; i < WISP_COUNT; i++) {
      const idx = pIdx++;
      pPopType[idx] = 3;
      pSeed[idx] = Math.random() * 1000.0;
      pDepth[idx] = 0.30 + Math.random() * 0.50;

      pU[idx] = Math.random();
      const sign = Math.random() > 0.5 ? 1.0 : -1.0;
      const baseSpan = width > 768 ? 65.0 : 42.0;
      const extraSpan = width > 768 ? 60.0 : 38.0;
      pNormalOffset[idx] = sign * (baseSpan + Math.random() * extraSpan);
      pSpeed[idx] = 0.011 + Math.random() * 0.015;

      pBaseSize[idx] = 0.65 + Math.random() * 0.55; // 0.65px - 1.2px
      pBaseAlpha[idx] = 0.06 + Math.random() * 0.13;

      pBreathFreq1[idx] = 0.09 + Math.random() * 0.11;
      pBreathPhase1[idx] = Math.random() * Math.PI * 2;
      pBreathFreq2[idx] = 0.04 + Math.random() * 0.04;
      pBreathPhase2[idx] = Math.random() * Math.PI * 2;

      pEmergenceDelay[idx] = Math.pow(Math.random(), 1.2) * 2.10;
      pSwirlSign[idx] = Math.random() > 0.5 ? 1.0 : -1.0;

      const col = darkPalette[Math.floor(Math.random() * darkPalette.length)];
      pColors[idx * 3] = col[0];
      pColors[idx * 3 + 1] = col[1];
      pColors[idx * 3 + 2] = col[2];
    }

    // (4) Population B: Atmospheric Floating Oil/Mist Rain Droplets
    // Distributed across the entire screen, flowing continuously downward from Section 2 onward
    for (let k = 0; k < RAIN_N; k++) {
      const idx = RIVER_N + k;
      pPopType[idx] = 4;
      pSeed[idx] = Math.random() * 1000.0;

      // Stratified depth layering for 3D atmospheric feel
      // ~45% distant layer (small, dim, slow)
      // ~40% mid layer (medium, moderate, steady)
      // ~15% near layer (slightly larger, slightly brighter, slightly faster)
      const depthRand = Math.random();
      let depth: number;
      let baseSize: number;
      let baseAlpha: number;
      let fallSpeed: number;

      if (depthRand < 0.45) {
        depth = 0.25 + Math.random() * 0.25;
        baseSize = 0.60 + Math.random() * 0.50; // 0.60px - 1.10px
        baseAlpha = 0.05 + Math.random() * 0.08; // 0.05 - 0.13
        fallSpeed = 16.0 + Math.random() * 14.0; // 16px/s - 30px/s
      } else if (depthRand < 0.85) {
        depth = 0.50 + Math.random() * 0.35;
        baseSize = 0.90 + Math.random() * 0.55; // 0.90px - 1.45px
        baseAlpha = 0.09 + Math.random() * 0.11; // 0.09 - 0.20
        fallSpeed = 26.0 + Math.random() * 18.0; // 26px/s - 44px/s
      } else {
        depth = 0.85 + Math.random() * 0.15;
        baseSize = 1.35 + Math.random() * 0.60; // 1.35px - 1.95px
        baseAlpha = 0.17 + Math.random() * 0.08; // 0.17 - 0.25
        fallSpeed = 38.0 + Math.random() * 18.0; // 38px/s - 56px/s
      }

      pDepth[idx] = depth;
      pBaseSize[idx] = baseSize;
      pBaseAlpha[idx] = baseAlpha;

      // Seed across full viewport
      pRainX[k] = Math.random() * width;
      pRainY[k] = Math.random() * height;
      pRainBaseVy[k] = fallSpeed;
      pRainBaseVx[k] = (Math.random() - 0.5) * 8.0;

      // Non-synchronized horizontal wave harmonics (subtle curves & zig-zags)
      pRainDriftFreq[k] = 0.25 + Math.random() * 0.45;
      pRainDriftAmp[k] = (8.0 + Math.random() * 16.0) * depth;
      pRainDriftPhase[k] = Math.random() * Math.PI * 2;

      // Secondary micro zig-zag oscillation
      pRainZigZagFreq[k] = 0.8 + Math.random() * 1.4;
      pRainZigZagAmp[k] = (2.0 + Math.random() * 4.0) * depth;

      // Non-synchronized organic breathing (slow, subtle)
      pBreathFreq1[idx] = 0.12 + Math.random() * 0.18;
      pBreathPhase1[idx] = Math.random() * Math.PI * 2;
      pBreathFreq2[idx] = 0.04 + Math.random() * 0.06;
      pBreathPhase2[idx] = Math.random() * Math.PI * 2;

      pEmergenceDelay[idx] = 0.0;

      const col = darkPalette[Math.floor(Math.random() * darkPalette.length)];
      pColors[idx * 3] = col[0];
      pColors[idx * 3 + 1] = col[1];
      pColors[idx * 3 + 2] = col[2];
    }

    if (gl && colorBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, pColors, gl.STATIC_DRAW);
    }

    // -------------------------------------------------------------------------
    // CURSOR TRACKING WITH PHYSICAL VELOCITY INJECTION & INERTIA
    // -------------------------------------------------------------------------
    let targetMouseX = width * 0.50;
    let targetMouseY = height * 0.74;
    let curMouseX = targetMouseX;
    let curMouseY = targetMouseY;
    let prevMouseX = curMouseX;
    let prevMouseY = curMouseY;
    let mouseVx = 0;
    let mouseVy = 0;

    let targetMouseActive = 0.0;
    let curMouseActive = 0.0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      targetMouseActive = 1.0;
    };

    const handleMouseLeave = () => {
      targetMouseActive = 0.0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    let targetScrollY = window.scrollY;
    let curScrollY = targetScrollY;
    let prevFrameScrollY = curScrollY;
    let scrollVelocity = 0;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // -------------------------------------------------------------------------
    // CONTINUOUS ANIMATION LOOP
    // -------------------------------------------------------------------------
    let lastTime = performance.now();

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const dt = Math.min((now - lastTime) * 0.001, 0.033);
      lastTime = now;

      // Monotonic time elapsed since actual page load
      const elapsed = (now - pageEntryTimestamp) * 0.001;

      // Smooth mouse follow with realistic physical inertia
      curMouseX += (targetMouseX - curMouseX) * Math.min(1.0, dt * 8.0);
      curMouseY += (targetMouseY - curMouseY) * Math.min(1.0, dt * 8.0);

      // Instantaneous cursor velocity
      const instVx = (curMouseX - prevMouseX) / (dt > 0.0001 ? dt : 0.016);
      const instVy = (curMouseY - prevMouseY) / (dt > 0.0001 ? dt : 0.016);
      prevMouseX = curMouseX;
      prevMouseY = curMouseY;

      // Velocity filter with momentum persistence (particles continue moving when mouse stops)
      mouseVx += (instVx - mouseVx) * Math.min(1.0, dt * 16.0);
      mouseVy += (instVy - mouseVy) * Math.min(1.0, dt * 16.0);

      const mouseSpeed = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy);
      // Normalized cursor heading
      const uvx = mouseSpeed > 1.0 ? mouseVx / mouseSpeed : 0.0;
      const uvy = mouseSpeed > 1.0 ? mouseVy / mouseSpeed : 0.0;

      curMouseActive += (targetMouseActive - curMouseActive) * Math.min(1.0, dt * 4.0);

      // Filtered scroll position and velocity
      prevFrameScrollY = curScrollY;
      curScrollY += (targetScrollY - curScrollY) * Math.min(1.0, dt * 6.0);
      const rawScrollVel = (curScrollY - prevFrameScrollY) / (dt > 0.0001 ? dt : 0.016);
      scrollVelocity += (rawScrollVel - scrollVelocity) * Math.min(1.0, dt * 7.0);

      // Master scroll-driven emergence for Population B (Floating Rain Droplets)
      // Completely absent at top hero (scrollY <= 40px)
      // Smoothly fades in over 40px -> 520px as user scrolls into Section 2
      // Remains fully active (1.0) through all subsequent sections (Thesis -> Footer)
      let rainMasterAlpha = 0.0;
      if (curScrollY > 40.0) {
        const p = Math.min(1.0, (curScrollY - 40.0) / 480.0);
        rainMasterAlpha = p * p * (3.0 - 2.0 * p);
      }

      // Vortex dynamic center (subtle organic drift)
      const vortexDriftX = Math.cos(elapsed * 0.06) * 14.0;
      const vortexDriftY = Math.sin(elapsed * 0.08) * 8.0;
      const vortexCenterX = width * VORTEX_NORM_X + vortexDriftX;
      const vortexCenterY = height * VORTEX_NORM_Y + vortexDriftY;
      const vortexBreath = 1.0 + Math.sin(elapsed * 0.24) * 0.035;

      const riverGlobalOscY = Math.sin(elapsed * 0.12) * 12.0;

      // Interaction Radius (260px desktop, 180px mobile)
      const cursorRadius = width > 768 ? 260.0 : 180.0;
      const cursorRadiusSq = cursorRadius * cursorRadius;
      const twoRadiusSq = 2.0 * cursorRadius * cursorRadius;

      // Fluid spring-mass-damper physics parameters:
      // k=3.4 (spring return force), gamma=2.3 (viscous fluid drag)
      // Produces natural momentum carryover, subtle fluid overshoot, and graceful 0.6s-1.8s settlement
      const springK = 3.4;
      const dampingGamma = 2.3;
      const dragFactor = Math.exp(-dampingGamma * dt);

      // =======================================================================
      // POPULATION A: HERO RIVER & VORTEX CONVECTION (Indices 0 -> RIVER_N - 1)
      // =======================================================================
      for (let i = 0; i < RIVER_N; i++) {
        const popType = pPopType[i];
        const depth = pDepth[i];
        const seed = pSeed[i];
        let fluidX = 0;
        let fluidY = 0;

        // (1) Main River & (3) Secondary Wisps
        if (popType === 1 || popType === 3) {
          // Dynamic speed modulation eliminating conveyor-belt lockstep
          const speedMod = 1.0 + 0.24 * Math.sin(pU[i] * 12.0 + elapsed * 0.35 + seed) +
                                 0.12 * Math.cos(pU[i] * 24.0 - elapsed * 0.22);
          pU[i] = (pU[i] + pSpeed[i] * speedMod * dt) % 1.0;
          const u = pU[i];

          const normX = -0.05 + u * 1.10;
          const riverX = normX * width;
          const centerlineY = getRiverCenterY(normX, height);

          // 1. COMPOUND ASYNCHRONOUS BREATHING (3 distinct frequencies, non-repeating)
          const breath1 = Math.sin(elapsed * pBreathFreq1[i] + pBreathPhase1[i]) * (13.0 * depth);
          const breath2 = Math.sin(elapsed * pBreathFreq2[i] + pBreathPhase2[i]) * (7.0 * depth);
          const breath3 = Math.cos(elapsed * 0.35 + seed) * (3.5 * depth);

          // 2. ENVELOPE EXPANSION / CONTRACTION:
          // The river thickness envelope expands and contracts smoothly as it flows
          const envelopeExpansion = 1.0 + 0.16 * Math.sin(elapsed * 0.18 + normX * 2.8) +
                                          0.08 * Math.cos(elapsed * 0.11 - normX * 1.9);
          const dynamicOffset = pNormalOffset[i] * envelopeExpansion;

          // 3. Multi-frequency wave harmonics
          const wave1 = Math.sin(normX * 8.0 + elapsed * 0.35 + seed * 0.3) * (9.0 * depth);
          const wave2 = Math.cos(normX * 15.0 - elapsed * 0.50 + seed * 0.6) * (4.5 * depth);

          // 4. Incompressible analytical 2D curl turbulence
          const curlFreq = 0.0032;
          const sX = riverX * curlFreq + elapsed * 0.07;
          const sY = centerlineY * curlFreq + elapsed * 0.05;
          // Particles near center have stronger coherent flow; particles near outer edges have more freedom
          const centerProximity = Math.exp(-Math.abs(pNormalOffset[i]) / 55.0);
          const edgeFreedom = 1.0 - 0.40 * centerProximity;

          const curlX = Math.sin(sY * 3.1416 + seed) * (12.0 * depth * edgeFreedom);
          const curlY = Math.cos(sX * 3.1416 + seed * 1.2) * (9.0 * depth * edgeFreedom);

          // 5. Cross-stream slow meandering wander
          const crossWander = Math.sin(elapsed * 0.15 + seed * 1.7) * (7.0 * depth);

          fluidX = riverX + curlX;
          fluidY = centerlineY + dynamicOffset + breath1 + breath2 + breath3 + wave1 + wave2 + crossWander + riverGlobalOscY + curlY;
        }
        // (2) One Broad Spiral Vortex (Centered at X ≈ 63%, Y ≈ 74%)
        else {
          pVortexAngle[i] += pVortexSpeed[i] * dt;
          const angle = pVortexAngle[i];

          // Vortex radial breathing: slowly expands and contracts in harmony with river
          const vortexExpansion = 1.0 + 0.08 * Math.sin(elapsed * 0.20 + seed * 0.2) +
                                        0.05 * Math.cos(elapsed * 0.09);
          const currentR = pVortexRadius[i] * vortexExpansion * vortexBreath;
          // Organic non-circular harmonic distortion
          const harmonicDistort = 1.0 + 0.12 * Math.cos(2.0 * angle + seed);

          const localVx = Math.cos(angle) * currentR * pVortexAspect[i] * harmonicDistort;
          const localVy = Math.sin(angle) * currentR * harmonicDistort;

          // Micro-turbulence in vortex field
          const microNoiseX = Math.sin(seed + elapsed * 0.14) * (2.8 * depth);
          const microNoiseY = Math.cos(seed * 1.2 + elapsed * 0.12) * (2.8 * depth);

          fluidX = vortexCenterX + localVx + microNoiseX;
          fluidY = vortexCenterY + localVy + riverGlobalOscY * 0.6 + microNoiseY;
        }

        const scrolledY = fluidY - curScrollY * 0.85;

        // ---------------------------------------------------------------------
        // WATER-LIKE FLUID DISTURBANCE WITH VELOCITY INJECTION & VERTICAL SPLASH
        // ---------------------------------------------------------------------
        const curX = fluidX + dispX[i];
        const curY = scrolledY + dispY[i];

        let forceX = 0;
        let forceY = 0;
        let alphaBoost = 0;
        let sizeBoost = 0;

        if (curMouseActive > 0.005) {
          const dx = curX - curMouseX;
          const dy = curY - curMouseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < cursorRadiusSq * 1.44 && distSq > 0.25) {
            const dist = Math.sqrt(distSq);

            // Smooth Gaussian falloff without sharp circular cutoff: exp(-d^2 / (2*R^2))
            const weight = Math.exp(-distSq / twoRadiusSq) * curMouseActive;

            // Unit radial vector (pointing outward from cursor)
            const urx = dx / dist;
            const ury = dy / dist;

            // Unit tangential vector (perpendicular swirl)
            const utx = -ury;
            const uty = urx;

            // 1. DIRECTIONAL WAKE TRAILING:
            // Cursor moving creates an elongated disturbed mass stretching BEHIND the cursor
            // (RIGHT movement -> trails LEFT, UP movement -> trails DOWN, etc.)
            if (mouseSpeed > 15.0) {
              // Longitudinal projection along cursor direction: negative = BEHIND cursor
              const proj = dx * uvx + dy * uvy;
              // Asymmetric wake: particles behind cursor receive strong momentum pull
              const wakeWeight = proj < 0
                ? weight * (1.0 + Math.min(2.2, -proj / (cursorRadius * 0.45)))
                : weight * 0.28;

              const trailMag = Math.min(380.0, mouseSpeed * 0.38) * wakeWeight * depth;
              forceX += -uvx * trailMag;
              forceY += -uvy * trailMag;
            }

            // 2. VERTICAL SPLASH / FLUID WAVE:
            // Particles crossing the cursor temporarily move significantly UP and DOWN
            // Smooth sign function for vertical separation (avoids jump discontinuity at dy=0)
            const smoothSignY = dy / Math.sqrt(dy * dy + 256.0);
            // Arch factor: maximum vertical splash in center, tapering laterally
            const archFactor = Math.max(0.25, 1.0 - (dx * dx) / cursorRadiusSq);
            const splashMag = (40.0 + Math.min(420.0, mouseSpeed * 0.44)) * weight * archFactor * depth;
            forceY += smoothSignY * splashMag;

            // 3. LATERAL FLUID DISPERSION (Parting water like a finger):
            const pushMag = Math.min(240.0, mouseSpeed * 0.26 + 28.0) * weight * depth;
            forceX += urx * pushMag;
            forceY += ury * pushMag * 0.65;

            // 4. TRAVELING CONCENTRIC WAVE RIPPLES:
            const ripplePhase = dist * 0.042 - elapsed * 7.5;
            const rippleMag = Math.sin(ripplePhase) * Math.min(24.0, 8.0 + mouseSpeed * 0.016) * weight * depth;
            forceX += urx * rippleMag;
            forceY += ury * rippleMag;

            // 5. COHERENT FLUID TURBULENCE & STATIONARY SWIRL:
            // Continuous micro-vortices in the disturbed wake
            const swirlSpeedMod = 36.0 / (1.0 + mouseSpeed * 0.018);
            const swirlMag = swirlSpeedMod * weight * pSwirlSign[i] * depth;
            forceX += utx * swirlMag;
            forceY += uty * swirlMag;

            // Localized curl eddies
            const eddyAngle = Math.atan2(dy, dx) * 2.0 + elapsed * 3.2 + seed * 0.5;
            const eddyMag = Math.sin(dist * 0.06 - elapsed * 3.5) * Math.min(22.0, 6.0 + mouseSpeed * 0.012) * weight * depth;
            forceX += Math.cos(eddyAngle) * eddyMag;
            forceY += Math.sin(eddyAngle) * eddyMag;

            // 6. LUMINOUS BRIGHTENING IN THE DISTURBED WAKE:
            alphaBoost = weight * Math.min(0.28, mouseSpeed * 0.00035 + 0.12);
            sizeBoost = weight * Math.min(0.85, mouseSpeed * 0.0007 + 0.35);
          }
        }

        // ---------------------------------------------------------------------
        // FLUID-LIKE PHYSICAL INERTIA: FORCE -> VELOCITY -> DAMPING -> POSITION
        // With underdamped spring return (subtle overshoot, zero snapping)
        // ---------------------------------------------------------------------
        const springFx = -springK * dispX[i];
        const springFy = -springK * dispY[i];

        const ax = forceX + springFx;
        const ay = forceY + springFy;

        dispVx[i] += ax * dt;
        dispVy[i] += ay * dt;

        // Exponential viscous fluid drag
        dispVx[i] *= dragFactor;
        dispVy[i] *= dragFactor;

        dispX[i] += dispVx[i] * dt;
        dispY[i] += dispVy[i] * dt;

        const finalX = fluidX + dispX[i];
        const finalY = scrolledY + dispY[i];

        // ---------------------------------------------------------------------
        // EMERGENCE LIFECYCLE & OPACITY BREATHING
        // -------------------------------------------------------------------------
        // Smooth staggered emergence from 0.0s to 2.2s
        let emergence = 1.0;
        const tEmergence = elapsed - pEmergenceDelay[i];
        if (tEmergence <= 0.0) {
          emergence = 0.0;
        } else if (tEmergence < 0.75) {
          const p = tEmergence / 0.75;
          emergence = p * p * (3.0 - 2.0 * p);
        }

        // Edge loop wrapping fade across horizontal viewport margins
        let wrapFade = 1.0;
        if (popType === 1 || popType === 3) {
          const normX = fluidX / width;
          if (normX < 0.04) {
            wrapFade = Math.max(0.0, (normX + 0.05) / 0.09);
          } else if (normX > 0.96) {
            wrapFade = Math.max(0.0, (1.05 - normX) / 0.09);
          }
        }

        // Strict upper hero protection: Y < 50% must remain pristine dark negative space
        let heroNegativeSpaceFade = 1.0;
        const normY = finalY / height;
        if (normY < 0.52) {
          heroNegativeSpaceFade = Math.max(0.0, (normY - 0.48) / 0.04);
        }

        // Asynchronous slow breathing modulation (0.78 to 1.00)
        const breath = 0.78 + 0.22 * Math.sin(elapsed * pBreathFreq1[i] + pBreathPhase1[i]);

        const computedAlpha =
          (pBaseAlpha[i] * breath + alphaBoost) *
          emergence *
          wrapFade *
          heroNegativeSpaceFade;

        const finalAlpha = Math.min(0.78, Math.max(0.0, computedAlpha));
        const finalSize = Math.max(0.35, (pBaseSize[i] + sizeBoost) * dpr);

        gpuPositions[i * 2] = finalX * dpr;
        gpuPositions[i * 2 + 1] = finalY * dpr;
        gpuSizes[i] = finalSize;
        gpuAlphas[i] = finalAlpha;
      }

      // =======================================================================
      // POPULATION B: ATMOSPHERIC FLOATING OIL/MIST RAIN (Indices RIVER_N -> TOTAL_N - 1)
      // Floating while falling, organic sideways drift, subtle curves, breathing,
      // scroll momentum coupling, soft cursor deflection, and seamless looping.
      // =======================================================================
      const scrollDownBoost = Math.max(-10.0, Math.min(36.0, scrollVelocity * 0.035));
      const scrollDriftBoost = Math.max(-16.0, Math.min(16.0, scrollVelocity * 0.015));
      const fieldBreathing = 1.0 + 0.06 * Math.sin(elapsed * 0.16) + 0.04 * Math.cos(elapsed * 0.09);

      for (let k = 0; k < RAIN_N; k++) {
        const idx = RIVER_N + k;
        const depth = pDepth[idx];
        const seed = pSeed[idx];

        // 1. VERTICAL MOTION (Floating downward like fine oil/mist droplets)
        const microSpeedOsc =
          1.0 + 0.12 * Math.sin(elapsed * 0.32 + seed) + 0.06 * Math.cos(elapsed * 0.54 + seed * 1.5);
        const effectiveVy =
          (pRainBaseVy[k] * microSpeedOsc + scrollDownBoost * depth) * fieldBreathing;

        pRainY[k] += effectiveVy * dt;

        // 2. HORIZONTAL DRIFT & ORGANIC MEANDER (Gentle curves, subtle sideways drift, not straight lines)
        const wave1 = Math.sin(elapsed * pRainDriftFreq[k] + pRainDriftPhase[k]) * pRainDriftAmp[k];
        const wave2 = Math.cos(elapsed * pRainZigZagFreq[k] + seed) * pRainZigZagAmp[k];
        const curlS = pRainX[k] * 0.0025 + pRainY[k] * 0.003 + elapsed * 0.07;
        const curlX = Math.sin(curlS * Math.PI * 2.0 + seed) * (4.2 * depth);

        const totalVx = pRainBaseVx[k] + scrollDriftBoost * 0.3 * (seed > 500 ? 1 : -1);
        pRainX[k] += totalVx * dt;

        // Seamless horizontal boundary wrapping
        if (pRainX[k] < -30.0) pRainX[k] += width + 60.0;
        else if (pRainX[k] > width + 30.0) pRainX[k] -= width + 60.0;

        // Seamless vertical boundary looping:
        // When reaching bottom, wrap smoothly to top with slightly randomized X so no visible patterns form
        if (pRainY[k] > height + 25.0) {
          pRainY[k] = -25.0;
          pRainX[k] = Math.random() * width;
          pRainDriftPhase[k] = Math.random() * Math.PI * 2;
        } else if (pRainY[k] < -25.0) {
          pRainY[k] = height + 25.0;
          pRainX[k] = Math.random() * width;
          pRainDriftPhase[k] = Math.random() * Math.PI * 2;
        }

        // 3. CURSOR DISTURBANCE (Soft gentle deflection, purely secondary to natural rain flow)
        let rForceX = 0;
        let rForceY = 0;
        if (curMouseActive > 0.02) {
          const rCurX = pRainX[k] + wave1 + wave2 + curlX + pRainDispX[k];
          const rCurY = pRainY[k] + pRainDispY[k];
          const rdx = rCurX - curMouseX;
          const rdy = rCurY - curMouseY;
          const rDistSq = rdx * rdx + rdy * rdy;
          const rRadius = 140.0;
          const rRadiusSq = rRadius * rRadius;

          if (rDistSq < rRadiusSq && rDistSq > 1.0) {
            const rDist = Math.sqrt(rDistSq);
            const rFactor = 1.0 - rDist / rRadius;
            const rPush = rFactor * rFactor * (30.0 + Math.min(28.0, mouseSpeed * 0.04)) * curMouseActive * depth;
            rForceX = (rdx / rDist) * rPush;
            rForceY = (rdy / rDist) * rPush * 0.45;
          }
        }

        // Damped spring-damper return for rain displacement (k=2.8, damping=2.5)
        const rSpringK = 2.8;
        const rDampFactor = Math.exp(-2.5 * dt);
        pRainDispVx[k] = (pRainDispVx[k] + (rForceX - rSpringK * pRainDispX[k]) * dt) * rDampFactor;
        pRainDispVy[k] = (pRainDispVy[k] + (rForceY - rSpringK * pRainDispY[k]) * dt) * rDampFactor;
        pRainDispX[k] += pRainDispVx[k] * dt;
        pRainDispY[k] += pRainDispVy[k] * dt;

        const drawX = pRainX[k] + wave1 + wave2 + curlX + pRainDispX[k];
        const drawY = pRainY[k] + pRainDispY[k];

        // 4. OPACITY & SOFT BOUNDARY BLENDING
        // Non-synchronized organic breathing (slow, subtle individual fluctuation)
        const breath = 0.82 + 0.18 * Math.sin(elapsed * pBreathFreq1[idx] + pBreathPhase1[idx]);

        // Soft vertical margin fading to eliminate hard pop-in at top and bottom edges
        let edgeFade = 1.0;
        if (drawY < 35.0) {
          edgeFade = Math.max(0.0, (drawY + 20.0) / 55.0);
        } else if (drawY > height - 35.0) {
          edgeFade = Math.max(0.0, (height + 20.0 - drawY) / 55.0);
        }

        // Upper Hero protection during transition
        let heroHeadProtect = 1.0;
        if (curScrollY < 420.0) {
          const topRatio = drawY / height;
          const protectLine = 0.45 * (1.0 - curScrollY / 420.0);
          if (topRatio < protectLine) {
            heroHeadProtect = Math.max(0.0, topRatio / Math.max(0.05, protectLine));
            heroHeadProtect = heroHeadProtect * heroHeadProtect;
          }
        }

        const finalAlpha = Math.min(
          0.26,
          Math.max(0.0, pBaseAlpha[idx] * breath * rainMasterAlpha * edgeFade * heroHeadProtect)
        );
        const finalSize = Math.max(0.4, pBaseSize[idx] * dpr);

        gpuPositions[idx * 2] = drawX * dpr;
        gpuPositions[idx * 2 + 1] = drawY * dpr;
        gpuSizes[idx] = finalSize;
        gpuAlphas[idx] = finalAlpha;
      }

      // -----------------------------------------------------------------------
      // WEBGL GPU DRAW CALL
      // Solid opaque #0B0C0E (11, 12, 14) background on every frame
      // -----------------------------------------------------------------------
      if (gl && program && posBuffer && sizeBuffer && alphaBuffer) {
        gl.clearColor(0.0431, 0.0471, 0.0549, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        if (uResLocation) {
          gl.uniform2f(uResLocation, canvas.width, canvas.height);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gpuPositions, gl.DYNAMIC_DRAW);
        if (aPosLocation >= 0) {
          gl.enableVertexAttribArray(aPosLocation);
          gl.vertexAttribPointer(aPosLocation, 2, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gpuSizes, gl.DYNAMIC_DRAW);
        if (aSizeLocation >= 0) {
          gl.enableVertexAttribArray(aSizeLocation);
          gl.vertexAttribPointer(aSizeLocation, 1, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gpuAlphas, gl.DYNAMIC_DRAW);
        if (aAlphaLocation >= 0) {
          gl.enableVertexAttribArray(aAlphaLocation);
          gl.vertexAttribPointer(aAlphaLocation, 1, gl.FLOAT, false, 0, 0);
        }

        if (colorBuffer && aColorLocation >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
          gl.enableVertexAttribArray(aColorLocation);
          gl.vertexAttribPointer(aColorLocation, 3, gl.FLOAT, false, 0, 0);
        }

        gl.drawArrays(gl.POINTS, 0, TOTAL_N);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#0B0C0E',
      }}
    >
      {/* LAYER 1: 96px Repeating Hairline Micro-Grid (Directly from reference) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(244, 245, 247, 0.018) 0 1px, transparent 1px 96px),
            repeating-linear-gradient(0deg, rgba(244, 245, 247, 0.013) 0 1px, transparent 1px 96px)
          `,
          backgroundPosition: '0 0',
          opacity: 0.70,
        }}
      />

      {/* LAYER 2: High-Performance GPU WebGL Particle Canvas (Permanently dark #0B0C0E) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0B0C0E',
          pointerEvents: 'none',
          display: 'block',
        }}
      />

      {/* LAYER 3: Micro-Grain Film Texture (Replicating Jamie McKaye .grain) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.026,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />

      {/* LAYER 4: Deep Obsidian Vignette (Focusing the reading column and keeping top hero clean) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(5, 6, 8, 0.65) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
