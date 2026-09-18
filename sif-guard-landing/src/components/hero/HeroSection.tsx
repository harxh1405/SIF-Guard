"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextMaskReveal } from "@/components/animations/TextMaskReveal";
import { Reveal } from "@/components/animations/Reveal";
import { TelemetryPills } from "./TelemetryPills";
import { OperationalSitesMap } from "./OperationalSitesMap";
import { HeroRefineryVisual } from "./HeroRefineryVisual";
import { StatsCounters } from "./StatsCounters";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  // Scroll-linked transforms: Hero content subtly fades and scales down (0.95) as user scrolls past it
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center overflow-hidden"
    >
      <motion.div
        style={{ scale, opacity, y, willChange: "transform, opacity" }}
        className="relative z-10 w-full"
      >
        {/* Top Kicker Pill */}
        <Reveal delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111624] border border-[#FF5500]/30 shadow-[0_0_15px_rgba(255,85,0,0.2)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#FFA043] font-bold">
              AI &nbsp;×&nbsp; NLP &nbsp;×&nbsp; PREDICT &nbsp;×&nbsp; PREVENT
            </span>
          </div>
        </Reveal>

        {/* Two-Column Grid: Headline & Body (Left) + Operational Sites Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          <div className="lg:col-span-8">
            {/* Word-by-word sliding mask reveal */}
            <TextMaskReveal
              text="SEE RISKS BEFORE THEY BECOME INCIDENTS."
              highlightWords={["BEFORE", "THEY"]}
              highlightClassName="text-gradient-orange"
              wordClassName="text-white"
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6"
              stagger={0.08}
            />

            <Reveal delay={0.3}>
              <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed font-normal">
                SIF-Guard turns safety reports, near-misses and observations into actionable intelligence — helping Oil India identify Serious Injury &amp; Fatality (SIF) risks early, across every operation.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.45}>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => scrollTo("#pipeline", { offset: -60 })}
                  className="glow-orange-button flex items-center gap-2.5 px-6 py-3 rounded-full text-white font-semibold text-sm cursor-pointer shadow-[0_0_24px_rgba(255,85,0,0.5)] hover:shadow-[0_0_35px_rgba(255,85,0,0.75)] transition-all"
                >
                  <span>Explore SIF-Guard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("#capabilities", { offset: -60 })}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-sm backdrop-blur-md transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
                  </div>
                  <span>Watch 2 min demo</span>
                </button>
              </div>
            </Reveal>
          </div>

          {/* Right Side: Operational Sites Map Card */}
          <div className="lg:col-span-4 flex justify-end">
            <OperationalSitesMap />
          </div>
        </div>

        {/* Centerpiece 3D Visual with Floating Telemetry Pills */}
        <div className="relative w-full">
          <TelemetryPills />
          <HeroRefineryVisual />
        </div>

        {/* Stats Strip */}
        <StatsCounters />
      </motion.div>
    </section>
  );
}
