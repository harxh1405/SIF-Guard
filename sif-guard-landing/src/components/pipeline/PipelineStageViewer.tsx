"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PIPELINE_STEPS } from "@/lib/constants";
import {
  FileText,
  Cpu,
  ShieldCheck,
  GitBranch,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Sparkles,
} from "lucide-react";

interface PipelineStageViewerProps {
  activeStep: number;
}

export function PipelineStageViewer({ activeStep }: PipelineStageViewerProps) {
  const current = PIPELINE_STEPS[activeStep];

  return (
    <div className="relative w-full rounded-2xl glass-panel p-6 sm:p-8 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.7)] min-h-[440px] flex flex-col justify-between overflow-hidden">
      {/* Background ambient corner glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#FF5500]/15 blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#FFA043] px-2 py-0.5 rounded bg-[#FF5500]/15 border border-[#FF5500]/30">
            STAGE {current.step}
          </span>
          <span className="text-xs text-[#94A3B8] font-mono">
            {current.subtitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#10B981]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{current.stats}</span>
        </div>
      </div>

      {/* Dynamic Animated Content Area */}
      <div className="my-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.step}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              {current.headline}
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-2xl mb-6">
              {current.description}
            </p>

            {/* Custom Interactive Visual Simulator per Stage */}
            {activeStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: "Rig-14_NearMiss_PTW.pdf", status: "PARSED", time: "12ms" },
                  { name: "OCS-03_HotWork_Scan.png", status: "OCR PROCESSED", time: "48ms" },
                  { name: "Duliajan_Observation_#4892.txt", status: "INGESTED", time: "4ms" },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-[11px] font-mono text-white font-medium truncate">
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-[#10B981] font-bold">{doc.status}</span>
                      <span className="text-[#64748B]">{doc.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeStep === 1 && (
              <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-3">
                <div className="text-[11px] font-mono text-[#94A3B8] flex items-center justify-between">
                  <span>UNSTRUCTURED FIELD REPORT</span>
                  <span className="text-[#FFA043]">10 DIMENSIONS EXTRACTED</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] text-xs font-mono text-slate-300 leading-relaxed">
                  &ldquo;During <span className="bg-[#FF5500]/30 text-[#FFA043] px-1 py-0.5 rounded border border-[#FF5500]/50">pipe tripping</span> on rig floor, assistant bypassed the <span className="bg-[#EF4444]/30 text-[#FCA5A5] px-1 py-0.5 rounded border border-[#EF4444]/50">hydraulic safety latch</span> with line pressurized to 3,200 PSI.&rdquo;
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Activity: Pipe Tripping", "Energy: High-Pressure Hydraulic", "Missing Barrier: Latch LOTO", "LSR: Line of Fire"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#38BDF8]/30 text-[#38BDF8] text-[10px] font-mono font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#090D16] border border-[#FF5500]/30 flex flex-col justify-between">
                  <span className="text-xs font-mono text-[#94A3B8]">
                    EXPLAINABLE SIF SCORE
                  </span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-[#FF5500] font-mono">
                      0.942
                    </span>
                    <span className="text-xs font-bold text-[#FF3B00] uppercase font-mono px-2 py-0.5 rounded bg-[#FF3B00]/20">
                      Critical Risk
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#CBD5E1]">
                    Confidence: 97.8% • XGBoost Ensemble + 16 Domain Rules
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-2">
                  <span className="text-xs font-mono text-[#94A3B8]">
                    TOP CONTRIBUTING FEATURES
                  </span>
                  {[
                    { rule: "Pressurized line > 1500 PSI without secondary barrier", weight: "+42%" },
                    { rule: "Personnel within swing radius / line-of-fire", weight: "+31%" },
                    { rule: "Unverified permit signoff timestamp", weight: "+18%" },
                  ].map((feat) => (
                    <div
                      key={feat.rule}
                      className="flex items-center justify-between text-[10px] font-mono py-1 border-b border-white/[0.04]"
                    >
                      <span className="text-slate-300 truncate mr-2">{feat.rule}</span>
                      <span className="text-[#FFA043] font-bold">{feat.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-[#FF6B35]" />
                    CLUSTER #04: HYDRAULIC VALVE ESCALATION
                  </span>
                  <span className="text-[#FF8A35]">Density: 0.91 • 14 Incidents</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-2 rounded bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[#94A3B8] block">Locations</span>
                    <span className="text-white font-bold">Rig-14, Rig-21, OCS-02</span>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[#94A3B8] block">Precursor Velocity</span>
                    <span className="text-[#EF4444] font-bold">↑ 28% This Month</span>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[#94A3B8] block">Barrier Status</span>
                    <span className="text-[#FFA043] font-bold">Bypassed in 9/14</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="p-4 rounded-xl bg-[#090D16] border border-[#FF5500]/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF5500] animate-bounce" />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      AUTOMATED DISPATCH: Immediate HSSE Intervention
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#FF8A35] bg-[#FF5500]/15 px-2 py-0.5 rounded border border-[#FF5500]/30">
                    PRIORITY 1
                  </span>
                </div>
                <p className="text-xs text-[#CBD5E1] font-mono">
                  High SIF precursor density detected at OCS-03. Required action: Stand-down review for all hydraulic isolation operations before next shift cycle.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF5500] text-white font-bold text-xs hover:bg-[#FF3B00] transition-colors"
                  >
                    Acknowledge &amp; Audit
                  </button>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] text-[#CBD5E1] font-medium text-xs hover:text-white transition-colors"
                  >
                    View Precursor Graph
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tag List */}
      <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-[11px] font-mono text-[#64748B] uppercase mr-2">
          Engine Stack:
        </span>
        {current.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-[#94A3B8]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
