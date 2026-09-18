"use client";

import { CAPABILITIES } from "@/lib/constants";
import { CapabilityCard } from "./CapabilityCard";
import { RiskTrendChart } from "./RiskTrendChart";
import { TopRiskCategories } from "./TopRiskCategories";
import { Reveal } from "@/components/animations/Reveal";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Header with Title & Tag */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF8A35] font-bold">
                Operational Intelligence
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
              Core <span className="text-gradient-orange">Capabilities</span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 text-xs font-mono font-bold tracking-wider text-[#CBD5E1] hover:text-white hover:border-[#FF5500]/40 transition-colors">
            <span>BUILT FOR OIL &amp; GAS OPERATIONS</span>
            <div className="w-5 h-5 rounded-full bg-[#FF5500]/20 flex items-center justify-center text-[#FF6B35]">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Two-Column Master Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 2x3 Grid of Capability Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAPABILITIES.map((cap, idx) => (
            <CapabilityCard
              key={cap.id}
              id={cap.id}
              icon={cap.icon}
              title={cap.title}
              description={cap.description}
              index={idx}
            />
          ))}
        </div>

        {/* Right Column: Analytics Hub (Risk Trend & Top Risk Categories) */}
        <div id="analytics" className="lg:col-span-5 flex flex-col gap-6 sticky top-28 scroll-mt-28">
          <RiskTrendChart />
          <TopRiskCategories />
        </div>
      </div>
    </section>
  );
}
