"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EXPO_OUT } from "@/hooks/useReveal";

interface TextMaskRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  highlightWords?: string[];
  highlightClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function TextMaskReveal({
  text,
  className = "",
  wordClassName = "",
  highlightWords = [],
  highlightClassName = "text-gradient-orange",
  delay = 0.1,
  stagger = 0.08,
  as = "h1",
}: TextMaskRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      y: shouldReduceMotion ? 0 : "110%",
      opacity: shouldReduceMotion ? 1 : 0,
      rotateX: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      y: "0%",
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.85,
        ease: EXPO_OUT,
      },
    },
  };

  const Component = motion[as];

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`flex flex-wrap ${className}`}
      style={{ perspective: 800 }}
    >
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
        const isHighlighted = highlightWords.some(
          (hw) => hw.toLowerCase() === cleanWord.toLowerCase() || hw.toLowerCase() === word.toLowerCase()
        );

        return (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden py-1"
            style={{ marginRight: "0.28em" }}
          >
            <motion.span
              variants={wordVariants}
              className={`inline-block will-change-transform ${
                isHighlighted ? highlightClassName : wordClassName
              }`}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </Component>
  );
}
