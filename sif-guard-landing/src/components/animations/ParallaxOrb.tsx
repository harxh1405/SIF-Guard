"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface ParallaxOrbProps {
  color?: "orange" | "amber" | "blue" | "crimson";
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  speed?: number; // e.g. -150 to +150
  opacity?: number;
  blur?: number;
  className?: string;
}

export function ParallaxOrb({
  color = "orange",
  size = 450,
  top,
  left,
  right,
  bottom,
  speed = 100,
  opacity = 0.25,
  blur = 100,
  className = "",
}: ParallaxOrbProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveSpeed = shouldReduceMotion || isMobile ? 0 : speed;
  const y = useTransform(scrollYProgress, [0, 1], [-effectiveSpeed, effectiveSpeed]);

  const colorMap = {
    orange: "radial-gradient(circle, rgba(255, 85, 0, 0.85) 0%, rgba(255, 107, 53, 0.4) 45%, rgba(0, 0, 0, 0) 70%)",
    amber: "radial-gradient(circle, rgba(255, 160, 67, 0.75) 0%, rgba(255, 107, 53, 0.3) 50%, rgba(0, 0, 0, 0) 70%)",
    blue: "radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(2, 132, 199, 0.25) 50%, rgba(0, 0, 0, 0) 70%)",
    crimson: "radial-gradient(circle, rgba(239, 68, 68, 0.7) 0%, rgba(185, 28, 28, 0.25) 50%, rgba(0, 0, 0, 0) 70%)",
  };

  return (
    <motion.div
      style={{
        y,
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        background: colorMap[color],
        opacity,
        filter: `blur(${blur}px)`,
        pointerEvents: "none",
        position: "absolute",
        zIndex: 0,
      }}
      className={`rounded-full will-change-transform ${className}`}
    />
  );
}
