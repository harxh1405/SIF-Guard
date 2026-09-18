"use client";

import { useTransform, useScroll, MotionValue, useReducedMotion } from "framer-motion";
import { RefObject, useState, useEffect } from "react";

export interface UseParallaxOptions {
  distance?: number;
  direction?: "up" | "down";
  clamp?: boolean;
}

export function useParallax(
  value?: MotionValue<number>,
  distance: number = 100
): MotionValue<number> {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll();
  const source = value || scrollYProgress;

  const effectiveDistance = shouldReduceMotion || isMobile ? 0 : distance;

  return useTransform(source, [0, 1], [-effectiveDistance, effectiveDistance]);
}

export function useElementParallax(
  ref: RefObject<HTMLElement | null>,
  distance: number = 100
): MotionValue<number> {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const effectiveDistance = shouldReduceMotion ? 0 : distance;
  return useTransform(scrollYProgress, [0, 1], [-effectiveDistance, effectiveDistance]);
}
