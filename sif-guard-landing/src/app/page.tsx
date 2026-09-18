"use client";

import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { DataStreamsTicker } from "@/components/ribbon/DataStreamsTicker";
import { CapabilitiesSection } from "@/components/capabilities/CapabilitiesSection";
import { PinnedPipelineSection } from "@/components/pipeline/PinnedPipelineSection";
import { PreFooterBanner } from "@/components/cta/PreFooterBanner";
import { Footer } from "@/components/layout/Footer";
import { ParallaxOrb } from "@/components/animations/ParallaxOrb";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#07090E] text-[#F1F5F9] overflow-hidden">
      {/* Ambient Parallax Gradient Light Orbs drifting at variable speeds */}
      <ParallaxOrb
        color="orange"
        size={600}
        top="-100px"
        right="-150px"
        speed={140}
        opacity={0.3}
        blur={120}
      />
      <ParallaxOrb
        color="amber"
        size={500}
        top="800px"
        left="-200px"
        speed={-120}
        opacity={0.2}
        blur={140}
      />
      <ParallaxOrb
        color="orange"
        size={650}
        top="2200px"
        right="-250px"
        speed={160}
        opacity={0.25}
        blur={130}
      />
      <ParallaxOrb
        color="blue"
        size={400}
        top="3400px"
        left="-150px"
        speed={-90}
        opacity={0.15}
        blur={150}
      />

      {/* Subtle Dot Matrix & Isometric Grid Overlay */}
      <div className="absolute inset-0 bg-grid-dots opacity-35 pointer-events-none z-0" />

      {/* Header */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* 1. Hero Section with 3D Refinery, Telemetry HUD & Stats */}
        <HeroSection />

        {/* 2. Operational Data Streams Marquee Ribbon */}
        <DataStreamsTicker />

        {/* 3. Core Capabilities & Live Analytics Hub */}
        <CapabilitiesSection />

        {/* 4. Cerebrium-Style 350vh Sticky Pinned Pipeline Section */}
        <PinnedPipelineSection />

        {/* 5. Pre-Footer "A Safer Tomorrow, Together" Banner */}
        <PreFooterBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
