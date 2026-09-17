import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getSiteAnalytics,
  getActivityAnalytics,
  getHazardAnalytics,
  getBarrierAnalytics,
  getLSRAnalytics,
  getTrendAnalytics,
  getDashboardSummary,
} from '../api/analytics';
import type {
  SiteRanking,
  ActivityRanking,
  HazardRanking,
  BarrierRanking,
  LSRRanking,
  TrendData,
  DashboardSummary,
} from '../types/api';
import type { TabId } from '../components/layout/Navigation';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import {
  TemporalTrendChart,
  FacilityRiskMatrix,
  BarrierRankingChart,
  LSRDistributionChart,
  HazardRankingChart,
  ActivityRankingChart,
  formatCount,
  formatPercentageWithContext,
} from '../components/charts';
import {
  Building2,
  Activity,
  ShieldAlert,
  BookOpen,
  TrendingUp,
  RotateCw,
  Sparkles,
  Search,
  ChevronRight,
  ShieldX,
  Flame,
  ArrowUpDown,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onNavigate?: (tab: TabId) => void;
  theme?: 'dark' | 'light';
}

export type ViewMode = 'command' | 'trends' | 'sites' | 'hazards_barriers' | 'lsr_activities';
export type WhySubTab = 'all' | 'barriers' | 'hazards';
export type HowSubTab = 'all' | 'lsr' | 'activities';

export const AnalyticsPage: React.FC<Props> = ({ onNavigate, theme = 'dark' }) => {
  // Navigation & Sub-tab States
  const [activeView, setActiveView] = useState<ViewMode>('command');
  const [whySubTab, setWhySubTab] = useState<WhySubTab>('all');
  const [howSubTab, setHowSubTab] = useState<HowSubTab>('all');

  // Analytics Datasets
  const [siteData, setSiteData] = useState<SiteRanking[]>([]);
  const [activityData, setActivityData] = useState<ActivityRanking[]>([]);
  const [hazardData, setHazardData] = useState<HazardRanking[]>([]);
  const [barrierData, setBarrierData] = useState<BarrierRanking[]>([]);
  const [lsrData, setLsrData] = useState<LSRRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  // Selected entities for drill-down
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedBarrier, setSelectedBarrier] = useState<string | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null);
  const [selectedLsr, setSelectedLsr] = useState<string | null>(null);

  // Controls & Filters
  const [trendGrouping, setTrendGrouping] = useState<'month' | 'quarter'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableSortField, setTableSortField] = useState<'site' | 'total_reports' | 'sif_count' | 'sif_density'>('sif_density');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);
  const [hazardViewMode, setHazardViewMode] = useState<'list' | 'chart'>('list');

  // Lifecycle
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const fetchAllAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const [sites, activities, hazards, barriers, lsr, trends, summary] = await Promise.all([
        getSiteAnalytics(50),
        getActivityAnalytics(50),
        getHazardAnalytics(50),
        getBarrierAnalytics(50),
        getLSRAnalytics(50),
        getTrendAnalytics(trendGrouping),
        getDashboardSummary().catch(() => null),
      ]);

      setError(null);
      setSiteData(sites || []);
      setActivityData(activities || []);
      setHazardData(hazards || []);
      setBarrierData(barriers || []);
      setLsrData(lsr || []);
      setTrendData(trends || []);
      if (summary) setDashboardSummary(summary);
      setLastSyncTime(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch safety telemetry intelligence');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendGrouping]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Derived KPI metrics strictly from real backend responses
  const kpis = useMemo(() => {
    const totalReports = dashboardSummary?.total_reports ?? siteData.reduce((acc, s) => acc + s.total_reports, 0);
    const sifPrecursors = dashboardSummary?.sif_precursor_count ?? siteData.reduce((acc, s) => acc + s.sif_count, 0);
    const avgDensity = totalReports > 0 ? (sifPrecursors / totalReports) * 100 : 0;
    const activeSites = siteData.filter((s) => s.sif_count > 0).length;
    const topBarrier = [...barrierData].sort((a, b) => b.sif_count - a.sif_count)[0];
    const topHazard = [...hazardData].sort((a, b) => b.sif_count - a.sif_count)[0];
    const topLsr = [...lsrData].sort((a, b) => b.count - a.count)[0];

    return {
      totalReports,
      sifPrecursors,
      avgDensity: avgDensity.toFixed(1),
      avgDensityNum: avgDensity,
      activeSites,
      totalSites: siteData.length,
      topBarrier,
      topHazard,
      topLsr,
    };
  }, [siteData, dashboardSummary, barrierData, hazardData, lsrData]);

  // Search & Sort for Facility Table
  const filteredAndSortedSites = useMemo(() => {
    const filtered = siteData.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (s.site || '').toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (tableSortField === 'site') {
        comparison = (a.site || '').localeCompare(b.site || '');
      } else if (tableSortField === 'total_reports') {
        comparison = a.total_reports - b.total_reports;
      } else if (tableSortField === 'sif_count') {
        comparison = a.sif_count - b.sif_count;
      } else if (tableSortField === 'sif_density') {
        comparison = a.sif_density - b.sif_density;
      }
      return tableSortAsc ? comparison : -comparison;
    });
  }, [siteData, searchQuery, tableSortField, tableSortAsc]);

  const handleSort = (field: 'site' | 'total_reports' | 'sif_count' | 'sif_density') => {
    if (tableSortField === field) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortField(field);
      setTableSortAsc(false);
    }
  };

  const handleFacilityClick = (siteName: string) => {
    setSelectedFacility((prev) => (prev === siteName ? null : siteName));
  };

  if (loading && !refreshing) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton rows={2} />
        <LoadingSkeleton rows={4} />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* ====================================================================
          1. COMMAND CENTER HEADER & TELEMETRY CONTROLS
         ==================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              SIF Intelligence
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 9px',
                borderRadius: '6px',
                background: 'rgba(32, 217, 151, 0.10)',
                border: '1px solid rgba(32, 217, 151, 0.25)',
                color: 'var(--success)',
                fontSize: '0.70rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  display: 'inline-block',
                }}
              />
              Live Telemetry
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Operational precursor signals and barrier integrity across monitored facilities
          </p>
        </div>

        {/* Sync Controls & Quick Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <button
            onClick={() => fetchAllAnalytics(true)}
            disabled={refreshing || loading}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
            title="Refresh analytics telemetry"
          >
            <RotateCw
              size={13}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('review')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
              title="Open Triage Review Queue"
            >
              <ShieldAlert size={13} color="var(--primary)" />
              <span>Triage Queue</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchAllAnalytics(true)} />}

      {/* ====================================================================
          2. EXECUTIVE KPI SUMMARY AREA (Exact numbers, no fabricated deltas)
         ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* KPI 1: Reports Analyzed */}
        <div
          className="card card-interactive"
          onClick={() => setActiveView('command')}
          style={{ padding: '14px 16px' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Reports Analyzed
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {formatCount(kpis.totalReports)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Safety records evaluated
          </div>
        </div>

        {/* KPI 2: SIF Precursors */}
        <div
          className="card card-interactive"
          onClick={() => setActiveView('trends')}
          style={{ padding: '14px 16px' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            SIF Precursors
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--danger)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {formatCount(kpis.sifPrecursors)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={12} />
            <span>High-potential energy events</span>
          </div>
        </div>

        {/* KPI 3: Average Density */}
        <div
          className="card card-interactive"
          onClick={() => setActiveView('sites')}
          style={{ padding: '14px 16px' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Average Precursor Density
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {kpis.avgDensity}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {kpis.sifPrecursors} SIFs / {kpis.totalReports} reports
          </div>
        </div>

        {/* KPI 4: Active Locations */}
        <div
          className="card card-interactive"
          onClick={() => setActiveView('sites')}
          style={{ padding: '14px 16px' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Active Precursor Locations
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            {kpis.activeSites}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>
              / {kpis.totalSites}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Locations with recorded SIFs
          </div>
        </div>

        {/* KPI 5: Top Barrier Defect */}
        <div
          className="card card-interactive"
          onClick={() => setActiveView('hazards_barriers')}
          style={{ padding: '14px 16px' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Primary Barrier Defect
          </div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--danger)',
              lineHeight: 1.2,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={kpis.topBarrier?.barrier_failure || 'None'}
          >
            {kpis.topBarrier ? kpis.topBarrier.barrier_failure : 'None'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {kpis.topBarrier ? `${kpis.topBarrier.sif_count} precursor failures` : 'No failures recorded'}
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. NAVIGATION SWITCHER (Refined segmented styling)
         ==================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--surface)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveView('command')}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeView === 'command' ? 'var(--surface-hover)' : 'transparent',
            color: activeView === 'command' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeView === 'command' ? 600 : 500,
            fontSize: '0.80rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            borderBottom: activeView === 'command' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <Compass size={14} color={activeView === 'command' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Command Center</span>
        </button>

        <button
          onClick={() => setActiveView('trends')}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeView === 'trends' ? 'var(--surface-hover)' : 'transparent',
            color: activeView === 'trends' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeView === 'trends' ? 600 : 500,
            fontSize: '0.80rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            borderBottom: activeView === 'trends' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <TrendingUp size={14} color={activeView === 'trends' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>1. WHAT Changed?</span>
        </button>

        <button
          onClick={() => setActiveView('sites')}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeView === 'sites' ? 'var(--surface-hover)' : 'transparent',
            color: activeView === 'sites' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeView === 'sites' ? 600 : 500,
            fontSize: '0.80rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            borderBottom: activeView === 'sites' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <Building2 size={14} color={activeView === 'sites' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>2. WHERE is Risk?</span>
        </button>

        <button
          onClick={() => setActiveView('hazards_barriers')}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeView === 'hazards_barriers' ? 'var(--surface-hover)' : 'transparent',
            color: activeView === 'hazards_barriers' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeView === 'hazards_barriers' ? 600 : 500,
            fontSize: '0.80rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            borderBottom: activeView === 'hazards_barriers' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <ShieldX size={14} color={activeView === 'hazards_barriers' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>3. WHY are Signals Occurring?</span>
        </button>

        <button
          onClick={() => setActiveView('lsr_activities')}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            background: activeView === 'lsr_activities' ? 'var(--surface-hover)' : 'transparent',
            color: activeView === 'lsr_activities' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeView === 'lsr_activities' ? 600 : 500,
            fontSize: '0.80rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            borderBottom: activeView === 'lsr_activities' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          <BookOpen size={14} color={activeView === 'lsr_activities' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>4. HOW are Controls Involved?</span>
        </button>
      </div>

      {/* ====================================================================
          4. EXECUTIVE OPERATIONAL INSIGHT (Structured & Deterministic)
         ==================================================================== */}
      {(activeView === 'command' || activeView === 'hazards_barriers') && kpis.topBarrier && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="var(--primary)" />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--primary-bright)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Operational Insight • Barrier Failure Signal
              </span>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('explorer')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                <span>View Related Reports in Explorer</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <strong>{kpis.topBarrier.barrier_failure}</strong> is the primary barrier defect identified across{' '}
            <strong>{kpis.topBarrier.sif_count}</strong> SIF precursor events out of{' '}
            <strong>{kpis.topBarrier.total_reports}</strong> total records (
            {Number(kpis.topBarrier.sif_density).toFixed(1)}% density).
            {kpis.topHazard && (
              <span>
                {' '}Most frequent accompanying hazard is <strong>{kpis.topHazard.hazard}</strong> (
                {kpis.topHazard.sif_count} precursors).
              </span>
            )}
            {kpis.topLsr && (
              <span>
                {' '}Primary Life-Saving Rule control involved:{' '}
                <strong>{kpis.topLsr.rule_name}</strong>.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          5. QUESTION 1: WHAT CHANGED? (Temporal Precursor Trend)
         ==================================================================== */}
      {(activeView === 'command' || activeView === 'trends') && (
        <div
          className="card"
          style={{
            padding: '20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                    background: 'rgba(255, 115, 0, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  WHAT CHANGED?
                </span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  SIF Precursor Trend
                </h2>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Temporal report volume, SIF precursor frequency, and precursor density over time
              </p>
            </div>
          </div>

          <TemporalTrendChart
            data={trendData}
            theme={theme}
            height={activeView === 'trends' ? '420px' : '320px'}
            grouping={trendGrouping}
            onGroupingChange={(g) => setTrendGrouping(g)}
          />
        </div>
      )}

      {/* ====================================================================
          6. QUESTION 2: WHERE IS RISK CONCENTRATED? (Facility Risk Landscape)
         ==================================================================== */}
      {(activeView === 'command' || activeView === 'sites') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Scatter / Bubble Matrix Card */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--primary)',
                      background: 'rgba(255, 115, 0, 0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    WHERE IS THE RISK SIGNAL?
                  </span>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    Facility Risk Landscape
                  </h2>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  X: Total Reports (Volume) • Y: Precursor Density (%) • Bubble Size: SIF Precursor Count
                </p>
              </div>

              {selectedFacility && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 115, 0, 0.12)',
                    border: '1px solid rgba(255, 115, 0, 0.3)',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Selected:</span>
                  <strong style={{ color: 'var(--primary-bright)' }}>{selectedFacility}</strong>
                  <button
                    onClick={() => setSelectedFacility(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '0.85rem',
                    }}
                    title="Clear selection"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <FacilityRiskMatrix
              data={siteData}
              theme={theme}
              height={activeView === 'sites' ? '420px' : '340px'}
              selectedFacility={selectedFacility}
              onFacilitySelect={handleFacilityClick}
            />

            {selectedFacility && onNavigate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.80rem',
                }}
              >
                <span>
                  Facility active in filter: <strong>{selectedFacility}</strong>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onNavigate('facility')}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.74rem', gap: '4px' }}
                  >
                    <span>View Digital Twin</span>
                    <ExternalLink size={12} />
                  </button>
                  <button
                    onClick={() => onNavigate('explorer')}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.74rem', gap: '4px' }}
                  >
                    <span>Filter Reports</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Facility Telemetry Table */}
          <div
            className="card"
            style={{
              padding: '20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Facility Telemetry & Precursor Distribution
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Exact incident records with sample-size reliability context
                </p>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Filter facilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '6px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.80rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th
                      onClick={() => handleSort('site')}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Facility Location</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('total_reports')}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontWeight: 600, textAlign: 'right' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>Total Reports</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('sif_count')}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontWeight: 600, textAlign: 'right' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>SIF Precursors</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('sif_density')}
                      style={{ padding: '8px 10px', cursor: 'pointer', fontWeight: 600, textAlign: 'right' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>Precursor Density</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'left' }}>
                      Sample Context
                    </th>
                    {onNavigate && <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedSites.map((item, idx) => {
                    const isSelected = selectedFacility === item.site;
                    const isSmallSample = item.total_reports < 5;
                    const pctInfo = formatPercentageWithContext(item.sif_count, item.total_reports);

                    return (
                      <tr
                        key={idx}
                        onClick={() => handleFacilityClick(item.site)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--surface-hover)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: isSelected ? 'var(--primary-bright)' : 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color={item.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
                            <span>{item.site}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {formatCount(item.total_reports)}
                        </td>
                        <td
                          style={{
                            padding: '9px 10px',
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: item.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)',
                          }}
                        >
                          {formatCount(item.sif_count)}
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          <span style={{ color: item.sif_count > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            {pctInfo.percentStr}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {pctInfo.contextStr}
                            </span>
                            {isSmallSample && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 179, 71, 0.12)',
                                  color: 'var(--warning)',
                                  border: '1px solid rgba(255, 179, 71, 0.25)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                Limited sample
                              </span>
                            )}
                          </div>
                        </td>
                        {onNavigate && (
                          <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('explorer');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                              }}
                            >
                              Explore →
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          7. QUESTION 3: WHY ARE SIGNALS OCCURRING? (Barriers & Hazards)
         ==================================================================== */}
      {(activeView === 'command' || activeView === 'hazards_barriers') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                    background: 'rgba(255, 115, 0, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  WHY ARE SIGNALS OCCURRING?
                </span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Barrier Integrity & Recurring Energy Hazards
                </h2>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Root-cause barrier defect modes and high-frequency energy exposure classes
              </p>
            </div>

            {activeView === 'hazards_barriers' && (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--surface-elevated)',
                  padding: '3px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setWhySubTab('all')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: whySubTab === 'all' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: whySubTab === 'all' ? 'var(--primary)' : 'transparent',
                    color: whySubTab === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setWhySubTab('barriers')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: whySubTab === 'barriers' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: whySubTab === 'barriers' ? 'var(--primary)' : 'transparent',
                    color: whySubTab === 'barriers' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Barriers
                </button>
                <button
                  onClick={() => setWhySubTab('hazards')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: whySubTab === 'hazards' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: whySubTab === 'hazards' ? 'var(--primary)' : 'transparent',
                    color: whySubTab === 'hazards' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Hazards
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: whySubTab === 'all' ? 'repeat(auto-fit, minmax(420px, 1fr))' : '1fr',
              gap: '16px',
            }}
          >
            {/* Barrier Ranking Card */}
            {(whySubTab === 'all' || whySubTab === 'barriers') && (
              <div
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldX size={15} color="var(--danger)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      Barrier Failure Defect Modes
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Ranked by SIF-linked barrier failure count
                  </p>
                </div>

                <BarrierRankingChart
                  data={barrierData}
                  theme={theme}
                  selectedBarrier={selectedBarrier}
                  onBarrierSelect={(b) => setSelectedBarrier((prev) => (prev === b ? null : b))}
                />
              </div>
            )}

            {/* Recurring Hazards Card (Ranked List as per Section 20) */}
            {(whySubTab === 'all' || whySubTab === 'hazards') && (
              <div
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Flame size={15} color="var(--warning)" />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        Recurring Hazard Signals
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                      Ranked energy hazard exposures with sample context
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '2px',
                      background: 'var(--surface-elevated)',
                      padding: '2px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <button
                      onClick={() => setHazardViewMode('list')}
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.68rem',
                        fontWeight: hazardViewMode === 'list' ? 600 : 500,
                        border: 'none',
                        borderRadius: '3px',
                        background: hazardViewMode === 'list' ? 'var(--primary)' : 'transparent',
                        color: hazardViewMode === 'list' ? '#FFFFFF' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setHazardViewMode('chart')}
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.68rem',
                        fontWeight: hazardViewMode === 'chart' ? 600 : 500,
                        border: 'none',
                        borderRadius: '3px',
                        background: hazardViewMode === 'chart' ? 'var(--primary)' : 'transparent',
                        color: hazardViewMode === 'chart' ? '#FFFFFF' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Chart
                    </button>
                  </div>
                </div>

                {hazardViewMode === 'chart' ? (
                  <HazardRankingChart
                    data={hazardData}
                    theme={theme}
                    selectedHazard={selectedHazard}
                    onHazardSelect={(h) => setSelectedHazard((prev) => (prev === h ? null : h))}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {hazardData.slice(0, 8).map((item, idx) => {
                      const isSelected = selectedHazard === item.hazard;
                      const maxSif = Math.max(...hazardData.map((h) => h.sif_count), 1);
                      const barPercent = Math.round((item.sif_count / maxSif) * 100);
                      const pctInfo = formatPercentageWithContext(item.sif_count, item.total_reports);

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedHazard((prev) => (prev === item.hazard ? null : item.hazard))}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--surface-hover)' : 'var(--surface-elevated)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.70rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.hazard}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {pctInfo.contextStr}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  color: item.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)',
                                }}
                              >
                                {pctInfo.percentStr}
                              </span>
                            </div>
                          </div>

                          {/* Visual proportion bar */}
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              borderRadius: '2px',
                              background: 'var(--border-subtle)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${barPercent}%`,
                                height: '100%',
                                background: item.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          8. QUESTION 4: HOW ARE CONTROLS INVOLVED? (LSR & Work Scopes)
         ==================================================================== */}
      {(activeView === 'command' || activeView === 'lsr_activities') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                    background: 'rgba(255, 115, 0, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  HOW ARE CONTROLS INVOLVED?
                </span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  IOGP Life-Saving Rules & Operational Work Scopes
                </h2>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Standardized life-saving rule control alignment and activity scope vulnerability
              </p>
            </div>

            {activeView === 'lsr_activities' && (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--surface-elevated)',
                  padding: '3px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setHowSubTab('all')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: howSubTab === 'all' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: howSubTab === 'all' ? 'var(--primary)' : 'transparent',
                    color: howSubTab === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setHowSubTab('lsr')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: howSubTab === 'lsr' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: howSubTab === 'lsr' ? 'var(--primary)' : 'transparent',
                    color: howSubTab === 'lsr' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Life-Saving Rules
                </button>
                <button
                  onClick={() => setHowSubTab('activities')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    fontWeight: howSubTab === 'activities' ? 600 : 500,
                    border: 'none',
                    borderRadius: '4px',
                    background: howSubTab === 'activities' ? 'var(--primary)' : 'transparent',
                    color: howSubTab === 'activities' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Work Scopes
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: howSubTab === 'all' ? 'repeat(auto-fit, minmax(420px, 1fr))' : '1fr',
              gap: '16px',
            }}
          >
            {/* Life-Saving Rules Chart */}
            {(howSubTab === 'all' || howSubTab === 'lsr') && (
              <div
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={15} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      IOGP Life-Saving Rule Distribution
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Match counts and percentage share across parsed records
                  </p>
                </div>

                <LSRDistributionChart
                  data={lsrData}
                  theme={theme}
                  selectedLsr={selectedLsr}
                  onLsrSelect={(r) => setSelectedLsr((prev) => (prev === r ? null : r))}
                />
              </div>
            )}

            {/* Operational Activities Chart */}
            {(howSubTab === 'all' || howSubTab === 'activities') && (
              <div
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={15} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      Operational Task & Activity Work Scopes
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Ranked by SIF precursor count with total report context
                  </p>
                </div>

                <ActivityRankingChart
                  data={activityData}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;
