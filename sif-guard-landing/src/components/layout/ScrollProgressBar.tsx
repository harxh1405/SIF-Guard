"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 35,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-[#FF3B00] via-[#FF6B35] to-[#FFA043] shadow-[0_0_12px_rgba(255,85,0,0.8)]"
        style={{ scaleX }}
      />
    </div>
  );
}
