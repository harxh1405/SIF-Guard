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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header Bar with Pipeline Status & Global Filter Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif, Fraunces, serif)',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--text-primary, #F4F3EE)',
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
                  backgroundColor: 'rgba(242, 169, 51, 0.15)',
                  color: '#F2A933',
                  border: '1px solid rgba(242, 169, 51, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Filter size={12} /> Active Filters
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary, #9CA8AA)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Real-time safety signal analysis for Oil India Limited (OIL) operational facilities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: '1px solid #203238',
                color: '#9CA8AA',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <BarrierFailureChart
          data={summary?.top_barrier_failures || []}
          onSelectBarrier={handleBarrierSelect}
          selectedBarriers={filters.barriers}
        />
        <BarrierHealthChart />
      </div>

      {/* Row 3: Emerging Precursor Patterns & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Emerging Precursor Patterns Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #0D171A)',
            border: '1px solid var(--border, #203238)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={18} color="#F2A933" />
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Fraunces, serif)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #F4F3EE)',
                  margin: 0,
                }}
              >
                EMERGING PRECURSOR PATTERNS
              </h3>
            </div>
            <button
              onClick={() => onNavigate('clusters')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F2A933',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Explore All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(summary?.emerging_patterns || []).slice(0, 3).map((pat) => (
              <div
                key={pat.id}
                onClick={() => onNavigate('clusters')}
                style={{
                  backgroundColor: 'rgba(17, 36, 41, 0.6)',
                  border: '1px solid #203238',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#F2A933';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#203238';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F4F3EE' }}>
                    {pat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#E54F4F',
                      backgroundColor: 'rgba(229,79,79,0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {pat.report_count} REPORTS
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#9CA8AA', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  Primary barrier failure: <strong style={{ color: '#F2A933' }}>{pat.dominant_barrier_failure || 'Pressure Isolation'}</strong>
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#647477' }}>
                  <span>Activity: {pat.dominant_activity || 'Maintenance'}</span>
                  <span>·</span>
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
