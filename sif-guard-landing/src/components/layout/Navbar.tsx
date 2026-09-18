"use client";

import { useState, useEffect } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { Search, ShieldAlert, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const { scrollTo } = useSmoothScroll();
  const [activeItem, setActiveItem] = useState("Home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      // Section spy
      const sections = ["hero", "pipeline", "capabilities", "analytics", "about"];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            const matched = NAV_ITEMS.find((item) => item.href === `#${sectionId}`);
            if (matched) setActiveItem(matched.label);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    e.preventDefault();
    setActiveItem(label);
    scrollTo(href, { offset: -80 });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-[#07090E]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
          : "py-5 bg-gradient-to-b from-[#07090E]/90 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero", "Home")}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E2638] to-[#0D121D] border border-white/10 group-hover:border-[#FF5500]/50 transition-colors shadow-[0_0_15px_rgba(255,85,0,0.15)]">
              {/* Hexagon Shield Core */}
              <div className="relative">
                <ShieldAlert className="w-5 h-5 text-[#FF6B35] group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF3B00] animate-ping" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                SIF-GUARD
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#FF5500]/20 text-[#FF8A35] border border-[#FF5500]/30">
                  AI
                </span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">
                OIL INDIA LIMITED
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0D121D]/70 border border-white/[0.08] backdrop-blur-md">
            {NAV_ITEMS.map((item) => {
              const isActive = activeItem === item.label;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.label)}
                  className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF5500]/25 via-[#FF6B35]/20 to-[#FFA043]/20 border border-[#FF5500]/40 shadow-[0_0_12px_rgba(255,85,0,0.3)] -z-10" />
                  )}
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Side: Quick Search & Oil India Limited Crest */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Pill */}
            <div className="relative hidden lg:flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports, sites, hazards..."
                className="w-56 xl:w-64 pl-9 pr-8 py-1.5 text-xs rounded-full bg-[#0D121D]/80 border border-white/[0.08] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#FF5500]/50 focus:ring-1 focus:ring-[#FF5500]/30 transition-all font-mono"
              />
              <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono text-[#64748B] bg-white/[0.06] border border-white/[0.08] rounded">
                ⌘K
              </kbd>
            </div>

            {/* Oil India Official Emblem */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-[#EA3323]/20 border border-[#EA3323]/40 flex items-center justify-center shadow-[0_0_10px_rgba(234,51,35,0.25)]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EA3323] ring-2 ring-white/30" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold tracking-tight text-white leading-tight">
                  OIL INDIA LIMITED
                </span>
                <span className="text-[9px] text-[#FF8A35] font-mono leading-tight">
                  Fueling a Safer Tomorrow
                </span>
              </div>
            </div>

            {/* Platform Quick Link */}
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-[#FF5500] to-[#FF3B00] shadow-[0_0_18px_rgba(255,85,0,0.45)] hover:shadow-[0_0_24px_rgba(255,85,0,0.7)] transition-all hover:-translate-y-0.5"
            >
              <span>Platform</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
