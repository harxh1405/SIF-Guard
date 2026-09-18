"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";
import { RISK_TREND_DATA } from "@/lib/constants";

export function RiskTrendChart() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(2); // Default to March peak
  const [timeframe, setTimeframe] = useState("Last 6 Months");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // SVG Chart Dimensions
  const width = 460;
  const height = 170;
  const padding = { top: 30, right: 20, bottom: 25, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxY = 200;

  // Calculate coordinates
  const points = RISK_TREND_DATA.map((d, i) => {
    const x = padding.left + (i / (RISK_TREND_DATA.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.value / maxY) * chartHeight;
    return { x, y, ...d };
  });

  // Smooth Bezier Curve generator
  const createSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full rounded-2xl glass-panel p-5 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
      {/* Header with Timeframe Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
            Risk Trend
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#94A3B8] rounded-md bg-white/[0.04] border border-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 glass-panel rounded-lg border border-white/10 shadow-xl z-20 py-1">
              {["Last 3 Months", "Last 6 Months", "Last 12 Months"].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => {
                    setTimeframe(tf);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1 text-[10px] font-mono text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Neon Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF5500" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines & Y-Axis labels */}
          {[200, 150, 100, 50, 0].map((val) => {
            const y = padding.top + chartHeight - (val / maxY) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-[#64748B] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Gradient fill below spline */}
          <path d={areaPath} fill="url(#riskAreaGrad)" />

          {/* Spline line */}
          <path
            d={linePath}
            fill="none"
            stroke="#FF6B35"
            strokeWidth="2.4"
            filter="url(#neonGlow)"
          />

          {/* Interactive Data Nodes */}
          {points.map((pt, i) => {
            const isSelected = selectedPoint === i;
            return (
              <g
                key={pt.month}
                className="cursor-pointer"
                onMouseEnter={() => setSelectedPoint(i)}
              >
                {/* Invisible hover target */}
                <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

                {/* Outer halo on active point */}
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    className="fill-[#FF5500]/30 stroke-[#FF5500] stroke-[1.5] animate-ping"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "4.5" : "3.5"}
                  fill={isSelected ? "#FFA043" : "#FF6B35"}
                  stroke="#0D121D"
                  strokeWidth="2"
                />

                {/* X-Axis labels */}
                <text
                  x={pt.x}
                  y={height - 4}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-colors ${
                    isSelected ? "fill-white font-bold" : "fill-[#64748B]"
                  }`}
                >
                  {pt.month}
                </text>
              </g>
            );
          })}

          {/* Highlight Badge for March Peak (matching reference image) */}
          {selectedPoint !== null && (
            <g
              transform={`translate(${points[selectedPoint].x}, ${
                points[selectedPoint].y - 32
              })`}
            >
              {/* Badge Background */}
              <rect
                x="-36"
                y="-14"
                width="72"
                height="22"
                rx="6"
                fill="#161F32"
                stroke="#FF5500"
                strokeWidth="1"
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.6))"
              />
              {/* Downward triangle pointer */}
              <polygon
                points="0,12 -4,8 4,8"
                fill="#161F32"
                stroke="#FF5500"
                strokeWidth="0.8"
              />
              <text
                x="0"
                y="-1"
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-[#FFA043]"
              >
                {points[selectedPoint].value} High Risk
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
