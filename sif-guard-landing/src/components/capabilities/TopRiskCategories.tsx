"use client";

import { motion } from "framer-motion";
import { TOP_RISK_CATEGORIES } from "@/lib/constants";

export function TopRiskCategories() {
  return (
    <div className="w-full rounded-2xl glass-panel p-5 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.08]">
        <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
          Top Risk Categories
        </span>
        <span className="text-[10px] font-mono text-[#94A3B8]">
          Field Observations
        </span>
      </div>

      <div className="space-y-3.5">
        {TOP_RISK_CATEGORIES.map((cat, idx) => (
          <div key={cat.label} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                {cat.label}
              </span>
              <span className="font-mono font-bold text-[#FFA043]">
                {cat.percentage}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${cat.percentage}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.9,
                  delay: 0.1 * idx,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`h-full rounded-full bg-gradient-to-r ${cat.color} shadow-[0_0_10px_rgba(255,85,0,0.4)]`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
