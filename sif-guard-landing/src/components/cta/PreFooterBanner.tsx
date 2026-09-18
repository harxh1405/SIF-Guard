"use client";

import Image from "next/image";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";

export function PreFooterBanner() {
  return (
    <section id="about" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#FF5500]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 z-10">
            <Reveal delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FFA043] font-bold">
                  PEOPLE &nbsp;×&nbsp; PROCESS &nbsp;×&nbsp; PREVENTION
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-5 uppercase">
                A Safer Tomorrow, <br />
                <span className="text-gradient-orange">Together.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl mb-8">
                Leveraging AI to protect our people, assets and environment across Oil India&apos;s operations. Every observation counts towards zero harm.
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-orange-button flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm shadow-[0_0_20px_rgba(255,85,0,0.5)] hover:shadow-[0_0_30px_rgba(255,85,0,0.75)] transition-all cursor-pointer"
                >
                  <span>Enter Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="mailto:hsse@oilindia.in"
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-sm backdrop-blur-md transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#FF6B35]" />
                  <span>Contact Us</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right Column: High-Resolution Visual with Supervisor & Dusk Refinery */}
          <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-full min-h-[380px] overflow-hidden">
            <Image
              src="/images/refinery-supervisor.jpg"
              alt="Oil India HSSE Field Supervisor at Refinery Dusk"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 500px"
            />
            {/* Dark gradient blend on left and bottom */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D121D] via-transparent to-transparent hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D121D] via-transparent to-transparent lg:hidden" />

            {/* Corner Badge */}
            <div className="absolute bottom-5 right-5 z-10 text-right">
              <div className="px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-right">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#FFA043] font-bold block">
                  SAFER PEOPLE
                </span>
                <span className="text-[9px] font-mono text-slate-300 block">
                  STRONGER OPERATIONS • A BRIGHTER TOMORROW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
