"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export function ScrollToTop() {
  const { scrollTo } = useSmoothScroll();
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setIsVisible(latest > 0.12);
      setProgressPercent(Math.round(latest * 100));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const handleScrollToTop = () => {
    scrollTo("#hero", { duration: 1.2, offset: 0 });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            type="button"
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
            className="group relative flex items-center justify-center w-12 h-12 rounded-full glass-panel border border-white/10 hover:border-[#FF5500]/50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_0_24px_rgba(255,85,0,0.4)] transition-all duration-300 cursor-pointer"
          >
            {/* SVG Circular Progress Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1"
              viewBox="0 0 44 44"
            >
              {/* Background circle */}
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-white/10"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Active laser progress circle */}
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-[#FF6B35] transition-all duration-150"
                strokeWidth="2.5"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner Arrow Icon */}
            <ArrowUp className="w-4 h-4 text-white group-hover:-translate-y-0.5 group-hover:text-[#FFA043] transition-all duration-200" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
