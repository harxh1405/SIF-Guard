"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { VerticalProgressRail } from "./VerticalProgressRail";
import { PipelineStageViewer } from "./PipelineStageViewer";
import { PIPELINE_STEPS } from "@/lib/constants";
import { Reveal } from "@/components/animations/Reveal";
import { ArrowRight, Sparkles, Workflow } from "lucide-react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export function PinnedPipelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lenis } = useSmoothScroll();
  const [activeStep, setActiveStep] = useState(0);

  // useScroll tracking the tall 350vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress (0 - 1) to active step (0 - 4)
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      const stepCount = PIPELINE_STEPS.length;
      const index = Math.max(
        0,
        Math.min(Math.floor(latest * stepCount), stepCount - 1)
      );
      setActiveStep(index);
    });
  }, [scrollYProgress]);

  // Jump to specific step in the 350vh container smoothly
  const handleSelectStep = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const containerHeight = containerRef.current.scrollHeight - window.innerHeight;
    const stepCount = PIPELINE_STEPS.length;
    // Target the center of each step's scroll range
    const progressFraction = (index + 0.5) / stepCount;
    const targetScroll = containerTop + progressFraction * containerHeight;

    if (lenis) {
      lenis.scrollTo(targetScroll, { duration: 1.0 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <section
      id="pipeline"
      ref={containerRef}
      className="relative h-[350vh] w-full"
    >
      {/* Pinned Sticky Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20 overflow-hidden">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Workflow className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#FF8A35] font-bold">
                  AI Pipeline Architecture
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                How <span className="text-gradient-orange">SIF-Guard Works</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#94A3B8] max-w-md hidden sm:block">
                Transforming unstructured safety data into actionable intelligence through a proven AI pipeline.
              </span>
              <a
                href="#capabilities"
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFA043] hover:text-white transition-colors shrink-0"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Horizontal Step Ribbon matching reference image (01 Ingest -> 02 Extract -> 03 Understand -> 04 Discover -> 05 Visualize) */}
          <div className="hidden md:flex items-center justify-between mt-4 py-3 px-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            {PIPELINE_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div key={step.step} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectStep(idx)}
                    className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-all ${
                        isActive
                          ? "bg-[#FF5500] text-white shadow-[0_0_12px_#FF5500]"
                          : "bg-white/[0.05] text-[#94A3B8] group-hover:text-white"
                      }`}
                    >
                      {step.step}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-bold transition-colors ${
                          isActive ? "text-white" : "text-[#94A3B8] group-hover:text-slate-200"
                        }`}
                      >
                        {step.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#64748B] hidden lg:block">
                        {step.subtitle}
                      </span>
                    </div>
                  </button>

                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Dual-Column Interaction: Vertical Rail (Left) + Interactive Stage Viewer (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <VerticalProgressRail
              progress={scrollYProgress}
              activeStep={activeStep}
              onSelectStep={handleSelectStep}
            />
          </div>

          <div className="col-span-1 md:col-span-8 lg:col-span-9">
            <PipelineStageViewer activeStep={activeStep} />
          </div>
        </div>
      </div>
    </section>
  );
}
