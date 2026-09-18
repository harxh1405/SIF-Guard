"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { PIPELINE_STEPS } from "@/lib/constants";

interface VerticalProgressRailProps {
  progress: MotionValue<number>;
  activeStep: number;
  onSelectStep: (index: number) => void;
}

export function VerticalProgressRail({
  progress,
  activeStep,
  onSelectStep,
}: VerticalProgressRailProps) {
  // Laser line height maps 0 -> 100%
  const lineHeight = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="relative flex flex-col justify-between h-[360px] py-2">
      {/* Background track line */}
      <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-white/[0.08]" />

      {/* Glowing orange laser progress line */}
      <motion.div
        style={{ height: lineHeight }}
        className="absolute left-[17px] top-4 w-[2px] bg-gradient-to-b from-[#FF3B00] via-[#FF6B35] to-[#FFA043] shadow-[0_0_10px_#FF5500] origin-top"
      />

      {/* Step nodes */}
      {PIPELINE_STEPS.map((step, idx) => {
        const isActive = activeStep === idx;
        const isPast = activeStep > idx;

        return (
          <button
            key={step.step}
            type="button"
            onClick={() => onSelectStep(idx)}
            className="group relative flex items-center gap-4 text-left focus:outline-none cursor-pointer z-10"
          >
            {/* Step circle node */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-br from-[#FF6B35] to-[#FF3B00] text-white shadow-[0_0_18px_rgba(255,85,0,0.8)] scale-110 border border-white/40"
                  : isPast
                  ? "bg-[#182030] text-[#FFA043] border border-[#FF6B35]/40"
                  : "bg-[#0B0F19] text-[#64748B] border border-white/[0.08] group-hover:border-white/20"
              }`}
            >
              {step.step}
            </div>

            {/* Label */}
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold tracking-tight transition-colors duration-200 ${
                  isActive
                    ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : "text-[#94A3B8] group-hover:text-slate-200"
                }`}
              >
                {step.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                {step.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
