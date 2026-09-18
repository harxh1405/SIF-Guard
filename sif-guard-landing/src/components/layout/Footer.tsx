"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { ShieldAlert, ArrowUp } from "lucide-react";

export function Footer() {
  const { scrollTo } = useSmoothScroll();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollTo(href, { offset: -80 });
  };

  const handleScrollTop = () => {
    scrollTo(0, { duration: 1.2 });
  };

  return (
    <footer className="w-full py-12 border-t border-white/[0.08] bg-[#05070B] relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E2638] to-[#0D121D] border border-white/10 text-[#FF6B35]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-white">
                SIF-GUARD
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#94A3B8] uppercase">
                OIL INDIA LIMITED
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#94A3B8]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Copyright & Back to Top */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#64748B] font-mono">
              &copy; {new Date().getFullYear()} SIF-Guard. All rights reserved.
            </span>

            <button
              type="button"
              onClick={handleScrollTop}
              aria-label="Scroll to top"
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
