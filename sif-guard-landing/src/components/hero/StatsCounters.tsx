"use client";

import { motion } from "framer-motion";
import { HERO_STATS } from "@/lib/constants";
import { Activity } from "lucide-react";

export function StatsCounters() {
  return (
    <div className="w-full mt-10 pt-6 border-t border-white/[0.08]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Label & Glowing Scanner Line */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] font-bold">
              Operational Data Streams
            </span>
          </div>
          {/* Animated laser scan bar */}
          <div className="relative w-full h-1 bg-[#1A2234] rounded-full overflow-hidden">
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent shadow-[0_0_10px_#FF5500]"
            />
          </div>
        </div>

        {/* 4 Stats Badges */}
        <div className="md:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {HERO_STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * idx, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col pl-3 border-l border-white/[0.08] hover:border-[#FF5500]/50 transition-colors"
            >
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                  stat.alert ? "text-[#FF5500] drop-shadow-[0_0_12px_rgba(255,85,0,0.4)]" : "text-white"
                }`}>
                  {stat.value}
                </span>
                {stat.alert && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FF3B00] animate-pulse" />
                )}
              </div>
              <span className="text-xs text-[#94A3B8] font-medium mt-0.5">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
