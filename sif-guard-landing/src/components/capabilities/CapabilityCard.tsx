"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Layers, Target, ShieldCheck, Link2, Share2, BarChart3, ArrowUpRight } from "lucide-react";
import { EXPO_OUT } from "@/hooks/useReveal";

interface CapabilityCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  index: number;
}

const ICON_MAP = {
  Layers,
  Target,
  ShieldCheck,
  Link2,
  Share2,
  BarChart3,
};

export function CapabilityCard({
  icon,
  title,
  description,
  index,
}: CapabilityCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = ICON_MAP[icon as keyof typeof ICON_MAP] || Layers;

  // Scroll-linked transform: scale from 0.92 -> 1 with blur(8px) -> blur(0px)
  const cardVariants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      scale: shouldReduceMotion ? 1 : 0.92,
      filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)",
      y: shouldReduceMotion ? 0 : 30,
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.8,
        delay: index * 0.08,
        ease: EXPO_OUT,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col justify-between p-6 rounded-2xl glass-panel-interactive overflow-hidden cursor-pointer"
      style={{ willChange: "transform, filter, opacity" }}
    >
      {/* Subtle top inner orange highlight on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF5500]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div>
        {/* Icon & Corner Arrow */}
        <div className="flex items-center justify-between mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF6B35] group-hover:scale-110 group-hover:bg-[#FF5500]/25 transition-all duration-300 shadow-[0_0_15px_rgba(255,85,0,0.2)]">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] group-hover:text-[#FF8A35] group-hover:border-[#FF5500]/40 transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-[#FFA043] transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Subtle bottom indicator */}
      <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
        <span>CAP-0{index + 1}</span>
        <span className="text-[#FF6B35]/80 opacity-0 group-hover:opacity-100 transition-opacity">
          ACTIVE IN PIPELINE
        </span>
      </div>
    </motion.div>
  );
}
