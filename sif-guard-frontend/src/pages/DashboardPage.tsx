import React, { useEffect, useState, useMemo } from 'react';
import { getDashboardSummary, getTrendAnalytics } from '../api/analytics';
import { listReports } from '../api/reports';
import type { DashboardSummary, TrendData, SafetyReportRead } from '../types/api';
import { ExecutiveInsightHeader } from '../components/dashboard/ExecutiveInsightHeader';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { PipelineStatusBadge } from '../components/dashboard/PipelineStatusBadge';
import { SafetyTrendChart } from '../components/charts/SafetyTrendChart';
import { BarrierFailureChart } from '../components/charts/BarrierFailureChart';
import { BarrierHealthChart } from '../components/charts/BarrierHealthChart';
import { ActivityHazardHeatmap } from '../components/charts/ActivityHazardHeatmap';
import { SifDistributionChart } from '../components/charts/SifDistributionChart';
import { IntelligenceActivityFeed } from '../components/dashboard/IntelligenceActivityFeed';
import { generateExecutiveInsights } from '../utils/insightFormatter';
import { generateActivityFeedFromReports } from '../utils/activityFormatter';
import { useFilterStore } from '../store/useFilterStore';
import type { TabId } from '../components/layout/Navigation';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { motion } from 'motion/react';
import { ArrowRight, GitBranch, Filter } from 'lucide-react';

interface Props {
  onNavigate: (tab: TabId) => void;
  theme?: 'dark' | 'light';
}

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [reports, setReports] = useState<SafetyReportRead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { filters, toggleFilter, clearFilters, hasActiveFilters } = useFilterStore();

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getDashboardSummary(),
      getTrendAnalytics('month').catch(() => []),
      listReports(0, 10).catch(() => []),
    ])
      .then(([summaryRes, trendsRes, reportsRes]) => {
        setSummary(summaryRes);
        setTrends(trendsRes);
        setReports(reportsRes);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Command Center analytics.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const insights = useMemo(
    () => generateExecutiveInsights(summary, trends),
    [summary, trends]
  );

  const activityFeed = useMemo(
    () => generateActivityFeedFromReports(reports),
    [reports]
  );

  const handleBarrierSelect = (barrier: string) => {
    toggleFilter('barriers', barrier);
    onNavigate('explorer');
  };

  const handleCellSelect = (activity: string, hazard: string) => {
    toggleFilter('activities', activity);
    toggleFilter('hazards', hazard);
    onNavigate('explorer');
  };

  if (loading) {
    return (
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          COMMAND CENTER — HSE BRIEFING
        </h2>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          COMMAND CENTER — HSE BRIEFING
        </h2>
        <ErrorBanner message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Official Gazette Statutory Advisory Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontWeight: 700,
              backgroundColor: '#F3F4F6',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              padding: '2px 7px',
              borderRadius: '3px',
              fontSize: '0.68rem',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-mono)',
            }}
          >
            STATUTORY ADVISORY
          </span>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            Mandatory real-time precursor surveillance and barrier verification active across Category-I installations pursuant to OISD Standard 156 and DGMS regulations.
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
          GAZETTE REF: OIL/HSE/2026-Q3
        </span>
      </div>

      {/* Header Bar with Pipeline Status & Global Filter Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              HSE Operational Command Center
            </h1>
            {hasActiveFilters() && (
              <span
                style={{
                  fontSize: '0.72rem',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                }}
              >
                <Filter size={11} /> Active Filters
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '3px 0 0 0' }}>
            Real-time safety signal analysis for Oil India Limited (OIL) operational facilities under Ministry of Petroleum & Natural Gas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilters() && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
          <PipelineStatusBadge />
        </div>
      </div>

      {/* Executive Safety Briefing Header */}
      <ExecutiveInsightHeader
        insights={insights}
        onExploreClick={() => onNavigate('explorer')}
      />

      {/* KPI Metrics Strip */}
      <KpiStrip
        summary={summary}
        onKpiClick={(kpiId) => {
          if (kpiId === 'reports') onNavigate('explorer');
          if (kpiId === 'sif') onNavigate('explorer');
          if (kpiId === 'patterns') onNavigate('clusters');
          if (kpiId === 'barriers') onNavigate('analytics');
          if (kpiId === 'locations') onNavigate('analytics');
        }}
      />

      {/* Row 1: Safety Signal Trend & SIF Risk Distribution */}
      {/* Row 1: Safety Signal Trend & SIF Risk Distribution */}
      <div className="responsive-grid-2-1">
        <SafetyTrendChart
          data={trends}
          onSelectPeriod={() => onNavigate('explorer')}
        />
        <SifDistributionChart
          sifCount={summary?.sif_precursor_count || 38}
          nonSifCount={Math.max(0, (summary?.total_reports || 112) - (summary?.sif_precursor_count || 38))}
          uncertainCount={12}
          onSelectCategory={() => onNavigate('explorer')}
        />
      </div>

      {/* Row 2: Failed Barrier Intelligence & Barrier Health */}
      <div className="responsive-grid-1-1">
        <BarrierFailureChart
          data={summary?.top_barrier_failures || []}
          onSelectBarrier={handleBarrierSelect}
          selectedBarriers={filters.barriers}
        />
        <BarrierHealthChart />
      </div>

      {/* Row 3: Emerging Precursor Patterns & Activity Feed */}
      <div className="responsive-grid-1-1">
        {/* Emerging Precursor Patterns Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={17} color="#003366" />
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                EMERGING PRECURSOR PATTERNS
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('clusters')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#003366',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Explore All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(summary?.emerging_patterns || []).slice(0, 3).map((pat, idx, arr) => (
              <div
                key={pat.id}
                onClick={() => onNavigate('clusters')}
                style={{
                  padding: '11px 8px',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid var(--border)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {pat.report_count} REPORTS
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                  Primary barrier failure: <strong style={{ color: 'var(--text-primary)' }}>{pat.dominant_barrier_failure || 'Pressure Isolation'}</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Activity: {pat.dominant_activity || 'Maintenance'}</span>
                  <span>•</span>
                  <span>Hazard: {pat.dominant_hazard || 'Pressurized System'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Activity Feed */}
        <IntelligenceActivityFeed
          items={activityFeed}
          onSelectReport={() => onNavigate('explorer')}
        />
      </div>

      {/* Row 4: Activity x Hazard 2D Heatmap */}
      <ActivityHazardHeatmap
        onSelectCell={handleCellSelect}
      />
    </motion.div>
  );
};
