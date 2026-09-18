import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/animations/SmoothScrollProvider";
import { ScrollProgressBar } from "@/components/layout/ScrollProgressBar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIF-GUARD | Oil India Limited - Industrial Safety AI Platform",
  description:
    "SIF-Guard turns safety reports, near-misses, and observations into actionable intelligence — helping Oil India identify Serious Injury & Fatality (SIF) risks early.",
  keywords: [
    "SIF-Guard",
    "Oil India Limited",
    "Industrial Safety AI",
    "Precursor Intelligence",
    "IOGP Life-Saving Rules",
    "Oil and Gas Safety",
  ],
  authors: [{ name: "Oil India Limited HSSE" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans antialiased bg-[#07090E] text-[#F1F5F9] selection:bg-[#FF5500] selection:text-white min-h-screen">
        <SmoothScrollProvider>
          <ScrollProgressBar />
          {children}
          <ScrollToTop />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
