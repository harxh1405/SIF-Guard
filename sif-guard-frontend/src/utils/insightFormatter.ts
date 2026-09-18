import type { DashboardSummary, BarrierRanking, PrecursorCluster, TrendData } from '../types/api';

export type SafetyInsightType = "TREND" | "BARRIER" | "PATTERN" | "LOCATION" | "ACTIVITY" | "SIF";
export type SafetyInsightSeverity = "critical" | "warning" | "informational";

export interface SafetyInsight {
  type: SafetyInsightType;
  severity: SafetyInsightSeverity;
  title: string;
  description: string;
  metric?: number;
  change?: number;
  evidence?: string[];
  reportIds?: string[];
}

/**
 * Deterministic Safety Insight Generator derived strictly from actual backend response data.
 * Adheres strictly to non-causal support phrasing ("observed in", "associated with", "concentrated around").
 */
export function generateExecutiveInsights(
  summary?: DashboardSummary | null,
  trends?: TrendData[] | null
): SafetyInsight[] {
  const insights: SafetyInsight[] = [];

  if (!summary) {
    return [
      {
        type: "SIF",
        severity: "informational",
        title: "SAFETY SIGNAL ANALYSIS INITIALIZING",
        description: "Awaiting baseline safety data from the analysis pipeline.",
      },
    ];
  }

  // 1. Barrier Failure Intelligence
  const topBarrier: BarrierRanking | undefined = summary.top_barrier_failures?.[0];
  if (topBarrier) {
    const barrierName = topBarrier.barrier_failure || "Barrier Control";
    const reportCount = topBarrier.total_reports || 0;
    const density = Math.round((topBarrier.sif_density || 0) * 100);

    insights.push({
      type: "BARRIER",
      severity: density >= 50 ? "critical" : "warning",
      title: `${barrierName.toUpperCase()} — PRIMARY CONTROL PRECURSOR`,
      description: `${barrierName} failures are observed in ${reportCount} safety reports during this analysis period, associated with a ${density}% SIF potential density.`,
      metric: reportCount,
      change: topBarrier.sif_count,
      evidence: [
        `Observed across ${summary.sites || 1} operational areas`,
        `Associated with high severity precursor potential in ${topBarrier.sif_count} reports`,
      ],
    });
  }

  // 2. Emerging Precursor Patterns
  const topCluster: PrecursorCluster | undefined = summary.emerging_patterns?.[0];
  if (topCluster) {
    const clusterName = topCluster.name || "Precursor Cluster";
    const count = topCluster.report_count || 0;
    const dominantActivity = topCluster.dominant_activity || "Maintenance";

    insights.push({
      type: "PATTERN",
      severity: topCluster.sif_density > 0.4 ? "critical" : "warning",
      title: `EMERGING PATTERN: ${clusterName.toUpperCase()}`,
      description: `${clusterName} patterns are concentrated around ${dominantActivity} operations, linking ${count} distinct field observation records.`,
      metric: count,
      evidence: [
        topCluster.dominant_barrier ? `Primary failed barrier: ${topCluster.dominant_barrier}` : "Multiple control failures identified",
        topCluster.dominant_hazard ? `Associated hazard: ${topCluster.dominant_hazard}` : "Cross-operational exposure",
      ],
      reportIds: topCluster.representative_report_ids || [],
    });
  }

  // 3. Temporal Trend Analysis
  if (trends && trends.length > 0) {
    const latest = trends[trends.length - 1];
    const change = latest.percentage_change || 0;
    const direction = change >= 0 ? "increased" : "decreased";

    insights.push({
      type: "TREND",
      severity: change > 15 ? "critical" : change > 0 ? "warning" : "informational",
      title: `SAFETY SIGNAL TEMPORAL DENSITY`,
      description: `SIF potential precursors have ${direction} by ${Math.abs(Math.round(change))}% compared with the baseline observation period (${latest.period}).`,
      metric: latest.sif_precursors,
      change: change,
      evidence: [
        `Total safety reports analyzed in period: ${latest.total_reports}`,
        `Period SIF precursor density: ${Math.round(latest.sif_density * 100)}%`,
      ],
    });
  }

  // 4. Overall SIF Potential Briefing
  if (summary.total_reports > 0) {
    const sifPercent = Math.round(
      (summary.sif_precursor_count / summary.total_reports) * 100
    );
    insights.push({
      type: "SIF",
      severity: sifPercent > 30 ? "critical" : "warning",
      title: "SIF EXPOSURE PORTFOLIO",
      description: `${summary.sif_precursor_count} out of ${summary.total_reports} analyzed reports (${sifPercent}%) contain exposure & control combinations associated with high SIF potential.`,
      metric: summary.sif_precursor_count,
      evidence: [
        `Identified across ${summary.activities} distinct activity types`,
        `Concentrated in ${summary.sites} operating facilities`,
      ],
    });
  }

  return insights;
}
