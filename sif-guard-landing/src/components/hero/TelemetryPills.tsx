"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { TELEMETRY_CALLOUTS } from "@/lib/constants";

export function TelemetryPills() {
  return (
    <>
      {TELEMETRY_CALLOUTS.map((pill, idx) => {
        // Subtle offset variations for float animation
        const floatDelays = [0, 1.2, 0.6];
        const delay = floatDelays[idx % floatDelays.length];

        return (
          <motion.div
            key={pill.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.4 + idx * 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: "absolute",
              ...pill.position,
            }}
            className="z-20 hidden md:block"
          >
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 4.5 + idx,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
              className="group cursor-pointer glass-panel px-3.5 py-2.5 rounded-xl border border-white/[0.12] hover:border-[#FF5500]/50 shadow-[0_12px_28px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(255,85,0,0.25)] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#FF5500]/20 border border-[#FF5500]/40 flex items-center justify-center text-[#FFA043]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {pill.title}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#FF6B35] flex items-center">
                      {pill.rate}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-mono">
                    {pill.details}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </>
  );
}
