"use client";

import { motion } from "framer-motion";
import { DATA_STREAMS } from "@/lib/constants";
import { FileText, Cpu, ShieldAlert, GitBranch, TrendingUp } from "lucide-react";

const ICON_MAP = {
  FileText,
  Cpu,
  ShieldAlert,
  GitBranch,
  TrendingUp,
};

export function DataStreamsTicker() {
  return (
    <div className="w-full py-6 border-y border-white/[0.08] bg-[#0A0E18]/60 backdrop-blur-md overflow-hidden relative">
      {/* Edge gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#07090E] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#07090E] to-transparent z-10 pointer-events-none" />

      <div className="flex select-none">
        <motion.div
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex items-center gap-6 whitespace-nowrap will-change-transform"
        >
          {/* Double items for seamless infinite loop */}
          {[...DATA_STREAMS, ...DATA_STREAMS].map((item, idx) => {
            const IconComponent = ICON_MAP[item.icon as keyof typeof ICON_MAP] || Cpu;

            return (
              <div
                key={`${item.title}-${idx}`}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#FF5500]/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF6B35]">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
