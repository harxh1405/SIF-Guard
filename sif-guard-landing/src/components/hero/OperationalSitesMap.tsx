"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { OPERATIONAL_SITES } from "@/lib/constants";

export function OperationalSitesMap() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:block w-72 rounded-2xl glass-panel p-4 border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-[#F1F5F9]">
            Operational Sites
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          6 Regions
        </span>
      </div>

      {/* Stylized Abstract Regional Vector Graphic */}
      <div className="relative w-full h-24 mb-3 rounded-lg bg-[#0A0D15]/80 border border-white/[0.06] overflow-hidden flex items-center justify-center">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-grid-isometric opacity-20" />
        
        {/* Abstract Northeast India Basin map paths */}
        <svg
          viewBox="0 0 200 100"
          className="w-full h-full text-[#FF5500]/20 stroke-current fill-none stroke-[1.2]"
        >
          {/* Stylized basin perimeter */}
          <path d="M 30,50 Q 55,20 90,30 T 140,25 T 175,60 T 130,85 T 60,75 Z" strokeDasharray="3 3" />
          <path d="M 65,38 L 105,42 L 135,32 L 150,55 L 125,72 L 80,68 Z" className="fill-[#FF5500]/[0.06]" />
          
          {/* Connecting telemetry pipelines */}
          <line x1="85" y1="42" x2="115" y2="38" className="stroke-[#FF6B35] stroke-[1.5]" />
          <line x1="115" y1="38" x2="135" y2="52" className="stroke-[#FF6B35] stroke-[1.5]" />
          <line x1="115" y1="38" x2="105" y2="65" className="stroke-[#FF6B35] stroke-[1.5]" />

          {/* Glowing sensor nodes */}
          <circle cx="85" cy="42" r="3" className="fill-[#FF5500] filter drop-shadow(0 0 4px #FF5500)" />
          <circle cx="115" cy="38" r="3.5" className="fill-[#FFA043] filter drop-shadow(0 0 6px #FFA043)" />
          <circle cx="135" cy="52" r="2.5" className="fill-[#FF5500]" />
          <circle cx="105" cy="65" r="2.5" className="fill-[#FF5500]" />
        </svg>

        <div className="absolute bottom-1.5 left-2 font-mono text-[9px] text-[#64748B]">
          BASIN GRID • OIL-NE
        </div>
      </div>

      {/* Sites list */}
      <div className="grid grid-cols-2 gap-1.5">
        {OPERATIONAL_SITES.map((site) => (
          <div
            key={site.name}
            className="flex items-center gap-1.5 py-1 px-2 rounded-md bg-white/[0.02] border border-white/[0.04] text-[10px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]/80 shadow-[0_0_6px_rgba(255,85,0,0.8)]" />
            <span className="text-[#CBD5E1] truncate font-medium">{site.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
