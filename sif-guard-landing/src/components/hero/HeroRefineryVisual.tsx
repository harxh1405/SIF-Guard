"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ShieldAlert, Cpu } from "lucide-react";

interface TelemetryBeacon {
  id: string;
  top: string;
  left: string;
  label: string;
  metric: string;
  status: "nominal" | "elevated" | "critical";
}

const BEACONS: TelemetryBeacon[] = [
  {
    id: "b1",
    top: "18%",
    left: "52%",
    label: "Flare Stack & Off-Gas Line",
    metric: "Purge Pressure: 4.8 bar (Normal)",
    status: "nominal",
  },
  {
    id: "b2",
    top: "34%",
    left: "44%",
    label: "Atmospheric Distillation Unit",
    metric: "Hot Work Permit Active • 340°C",
    status: "elevated",
  },
  {
    id: "b3",
    top: "66%",
    left: "52%",
    label: "LPG Spherical Containment Tank #3",
    metric: "LOTO Protocol Active • SIF Flagged",
    status: "critical",
  },
  {
    id: "b4",
    top: "48%",
    left: "85%",
    label: "Crude Storage Terminal",
    metric: "Ultrasonic Gauging: Nominal",
    status: "nominal",
  },
];

export function HeroRefineryVisual() {
  const [activeBeacon, setActiveBeacon] = useState<TelemetryBeacon | null>(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] group">
      {/* 3D Refinery Visual */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
        <Image
          src="/images/refinery-hero.jpg"
          alt="Oil India Limited 3D Digital Twin Refinery Complex"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Ambient Warm Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-[#07090E]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E]/60 via-transparent to-[#07090E]/60" />

        {/* Interactive Telemetry Beacon Points (⨁) */}
        {BEACONS.map((beacon) => {
          const isCritical = beacon.status === "critical";
          const isElevated = beacon.status === "elevated";

          return (
            <div
              key={beacon.id}
              style={{ top: beacon.top, left: beacon.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              onMouseEnter={() => setActiveBeacon(beacon)}
              onMouseLeave={() => setActiveBeacon(null)}
            >
              <button
                type="button"
                aria-label={`View sensor details for ${beacon.label}`}
                className="relative flex items-center justify-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-[#FF6B35]/80 cursor-pointer group/node"
              >
                {/* Radar ripple rings */}
                <span className="absolute inset-0 rounded-full bg-[#FF5500] animate-ping opacity-60" />
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isCritical
                      ? "bg-[#FF3B00] shadow-[0_0_10px_#FF3B00]"
                      : isElevated
                      ? "bg-[#FFA043] shadow-[0_0_10px_#FFA043]"
                      : "bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
                  }`}
                />
              </button>
            </div>
          );
        })}

        {/* Interactive Hover Tooltip */}
        <AnimatePresence>
          {activeBeacon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.2 }}
              style={{
                top: `calc(${activeBeacon.top} - 68px)`,
                left: activeBeacon.left,
              }}
              className="absolute -translate-x-1/2 z-30 pointer-events-none w-64 glass-panel px-3 py-2 rounded-lg border border-[#FF6B35]/60 shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Radio className="w-3 h-3 text-[#FF6B35] animate-pulse" />
                <span className="text-[11px] font-bold text-white tracking-tight">
                  {activeBeacon.label}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#CBD5E1] block">
                {activeBeacon.metric}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Industrial Branding Stencil on Wall */}
        <div className="absolute bottom-4 left-6 z-10 hidden sm:block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="font-mono text-[11px] font-bold tracking-widest text-white uppercase">
              OIL INDIA LIMITED • DULIAJAN ASSET
            </span>
          </div>
        </div>

        {/* Coordinates & Tagline HUD (Bottom Right) */}
        <div className="absolute bottom-4 right-6 z-10 text-right">
          <div className="flex flex-col items-end">
            <span className="font-mono text-xs font-bold text-[#FFA043] tracking-widest drop-shadow-[0_0_8px_rgba(255,160,67,0.5)]">
              27.1767° N 95.7489° E
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase text-[#94A3B8]">
              Industrial Intelligence For A Safer Tomorrow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
