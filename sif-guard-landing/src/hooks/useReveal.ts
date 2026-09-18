"use client";

import { useReducedMotion } from "framer-motion";

export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export interface UseRevealOptions {
  delay?: number;
  duration?: number;
  yOffset?: number;
  stagger?: number;
}

export function useReveal(options: UseRevealOptions = {}) {
  const { delay = 0, duration = 0.8, yOffset = 40, stagger = 0.1 } = options;
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        delay,
        ease: EXPO_OUT,
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        ease: EXPO_OUT,
      },
    },
  };

  return {
    containerVariants,
    itemVariants,
    viewport: { once: true, amount: 0.25 },
  };
}
