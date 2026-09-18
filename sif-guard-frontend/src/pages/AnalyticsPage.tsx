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
  Building2,
  Activity,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  TrendingUp,
  RotateCw,
  Sparkles,
  Search,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

interface Props {
  onNavigate?: (tab: TabId) => void;
}

type DimensionTab = 'sites' | 'activities' | 'hazards' | 'barriers' | 'lsr' | 'trends';
type MetricChoice = 'density' | 'sif_count' | 'total_reports';

const CustomRankedTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const density = data.sif_density !== undefined ? (data.sif_density * 100).toFixed(1) : null;
    const precursors = data.sif_count ?? data.count ?? 0;
    const total = data.total_reports;
    const title = data.displayName || data.site || data.activity || data.hazard || data.barrier_failure || data.rule_name;

    const isHighRisk = data.sif_density >= 0.10 || precursors >= 4;
    const isMediumRisk = data.sif_density > 0 || precursors > 0;

    return (
      <div
        style={{
          background: '#211710',
          border: '1px solid #33251C',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
          minWidth: '220px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.92rem',
            color: '#F5EEE8',
            marginBottom: '10px',
            borderBottom: '1px solid #33251C',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {isHighRisk ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(232, 93, 93, 0.15)',
                color: '#E85D5D',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              HIGH RISK
            </span>
          ) : isMediumRisk ? (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 179, 71, 0.15)',
                color: '#FFB347',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              ELEVATED
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(32, 217, 151, 0.15)',
                color: '#20D997',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              NOMINAL
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5AAA1' }}>
            <span>SIF Precursors:</span>
            <span
              style={{
                color: precursors > 0 ? '#E85D5D' : '#F5EEE8',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {precursors}
            </span>
          </div>

          {total !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5AAA1' }}>
              <span>Total Reports:</span>
              <span style={{ color: '#F5EEE8', fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {total}
              </span>
            </div>
          )}

          {density !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5AAA1', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>Precursor Density:</span>
              <span
                style={{
                  color: '#FF6A00',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {density}%
              </span>
            </div>
          )}

          {data.percentage !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5AAA1' }}>
              <span>Share:</span>
              <span style={{ color: '#FF6A00', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {data.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsPage: React.FC<Props> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<DimensionTab>('sites');

  // Analytics Datasets
  const [siteData, setSiteData] = useState<SiteRanking[]>([]);
  const [activityData, setActivityData] = useState<ActivityRanking[]>([]);
  const [hazardData, setHazardData] = useState<HazardRanking[]>([]);
  const [barrierData, setBarrierData] = useState<BarrierRanking[]>([]);
  const [lsrData, setLsrData] = useState<LSRRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  // Filters & State
  const [siteMetric, setSiteMetric] = useState<MetricChoice>('density');
  const [activityMetric, setActivityMetric] = useState<MetricChoice>('density');
  const [siteLimit, setSiteLimit] = useState<number>(10);
  const [trendGrouping, setTrendGrouping] = useState<'month' | 'quarter'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      setSiteData(sites);
      setActivityData(activities);
      setHazardData(hazards);
      setBarrierData(barriers);
      setLsrData(lsr);
      setTrendData(trends);
      if (summary) setDashboardSummary(summary);
      setLastSyncTime(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to load hotspot analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendGrouping]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Derived KPI metrics calculated strictly from real data
  const kpis = useMemo(() => {
    const totalReports = dashboardSummary?.total_reports ?? siteData.reduce((acc, s) => acc + s.total_reports, 0);
    const sifPrecursors = dashboardSummary?.sif_precursor_count ?? siteData.reduce((acc, s) => acc + s.sif_count, 0);
    const avgDensity = totalReports > 0 ? (sifPrecursors / totalReports) * 100 : 0;
    const highRiskSites = siteData.filter((s) => s.sif_density >= 0.05 || s.sif_count >= 2).length;

    return {
      totalReports,
      sifPrecursors,
      avgDensity: avgDensity.toFixed(1),
      highRiskSites,
    };
  }, [siteData, dashboardSummary]);

  // Ranked & Sorted Sites for Primary Chart
  const sortedSites = useMemo(() => {
    const sorted = [...siteData].sort((a, b) => {
      if (siteMetric === 'density') {
        return b.sif_density - a.sif_density || b.sif_count - a.sif_count;
      }
      if (siteMetric === 'sif_count') {
        return b.sif_count - a.sif_count || b.sif_density - a.sif_density;
      }
      return b.total_reports - a.total_reports;
    });

    return siteLimit > 0 ? sorted.slice(0, siteLimit) : sorted;
  }, [siteData, siteMetric, siteLimit]);

  const siteChartData = useMemo(() => {
    return sortedSites.map((s, idx) => ({
      ...s,
      displayName: s.site || 'Unknown Location',
      rank: idx + 1,
      displayValue:
        siteMetric === 'density'
          ? parseFloat((s.sif_density * 100).toFixed(1))
          : siteMetric === 'sif_count'
          ? s.sif_count
          : s.total_reports,
    }));
  }, [sortedSites, siteMetric]);

  // Top site for Key Insight
  const topSite = useMemo(() => {
    if (siteData.length === 0) return null;
    return [...siteData].sort((a, b) => b.sif_density - a.sif_density || b.sif_count - a.sif_count)[0];
  }, [siteData]);

  // Filtered sites for table
  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return siteData;
    const q = searchQuery.toLowerCase();
    return siteData.filter((s) => s.site.toLowerCase().includes(q));
  }, [siteData, searchQuery]);

  // Ranked Activities for Activity Chart
  const sortedActivities = useMemo(() => {
    const sorted = [...activityData].sort((a, b) => {
      if (activityMetric === 'density') {
        return b.sif_density - a.sif_density || b.sif_count - a.sif_count;
      }
      if (activityMetric === 'sif_count') {
        return b.sif_count - a.sif_count || b.sif_density - a.sif_density;
      }
      return b.total_reports - a.total_reports;
    });
    return sorted.slice(0, 10);
  }, [activityData, activityMetric]);

  const activityChartData = useMemo(() => {
    return sortedActivities.map((a, idx) => ({
      ...a,
      displayName: a.activity || 'Unspecified Activity',
      rank: idx + 1,
      displayValue:
        activityMetric === 'density'
          ? parseFloat((a.sif_density * 100).toFixed(1))
          : activityMetric === 'sif_count'
          ? a.sif_count
          : a.total_reports,
    }));
  }, [sortedActivities, activityMetric]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}
    >
      {/* 1. PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.65rem' }}>
              Analytics & Trends
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(32, 217, 151, 0.10)',
                border: '1px solid rgba(32, 217, 151, 0.25)',
                color: 'var(--success)',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  boxShadow: '0 0 8px rgba(32, 217, 151, 0.8)',
                  display: 'inline-block',
                }}
              />
              SYSTEM OPERATIONAL
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Monitor precursor patterns, facility density, and emerging risk signals across operational assets
          </p>
        </div>

        {/* Sync Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => fetchAllAnalytics(true)}
            disabled={refreshing || loading}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px' }}
            title="Refresh analytics telemetry"
          >
            <RotateCw size={14} className={refreshing ? 'spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI ROW (Calculated purely from real data) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1: Total Reports */}
        <div
          className="card"
          style={{
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '16px',
              right: '16px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
              opacity: 0.7,
            }}
          />
          <div className="micro-label" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
            TOTAL REPORTS
          </div>
          <div
            className="numeric-display"
            style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}
          >
            {kpis.totalReports}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={13} color="var(--primary)" />
            <span>Operational records monitored</span>
          </div>
        </div>

        {/* KPI 2: SIF Precursors */}
        <div
          className="card"
          style={{
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '16px',
              right: '16px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--danger), transparent)',
              opacity: 0.7,
            }}
          />
          <div className="micro-label" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
            SIF PRECURSORS
          </div>
          <div
            className="numeric-display"
            style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}
          >
            {kpis.sifPrecursors}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={13} color="var(--danger)" />
            <span>High energy & barrier failures</span>
          </div>
        </div>

        {/* KPI 3: Avg Density */}
        <div
          className="card"
          style={{
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '16px',
              right: '16px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--warning), transparent)',
              opacity: 0.7,
            }}
          />
          <div className="micro-label" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
            AVG. DENSITY
          </div>
          <div
            className="numeric-display"
            style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}
          >
            {kpis.avgDensity}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={13} color="var(--warning)" />
            <span>Precursor-to-volume ratio</span>
          </div>
        </div>

        {/* KPI 4: High-Risk Sites */}
        <div
          className="card"
          style={{
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '16px',
              right: '16px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
              opacity: 0.7,
            }}
          />
          <div className="micro-label" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
            HIGH-RISK SITES
          </div>
          <div
            className="numeric-display"
            style={{ fontSize: '1.9rem', fontWeight: 600, color: kpis.highRiskSites > 0 ? 'var(--danger)' : 'var(--success)', marginBottom: '4px' }}
          >
            {kpis.highRiskSites}
          </div>
          <div style={{ fontSize: '0.75rem', color: kpis.highRiskSites > 0 ? 'var(--danger)' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={13} color={kpis.highRiskSites > 0 ? 'var(--danger)' : 'var(--success)'} />
            <span>{kpis.highRiskSites > 0 ? 'Requires priority review' : 'Nominal barrier status'}</span>
          </div>
        </div>
      </div>

      {/* 3. ANALYTICS DIMENSION SUB-TABS */}
      <div
        className="card"
        style={{
          padding: '6px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          background: 'var(--surface)',
        }}
      >
        {[
          { id: 'sites', label: 'Sites & Locations', icon: Building2 },
          { id: 'activities', label: 'Activities & Tasks', icon: Activity },
          { id: 'hazards', label: 'Recurring Hazards', icon: AlertTriangle },
          { id: 'barriers', label: 'Barrier Failures', icon: ShieldAlert },
          { id: 'lsr', label: 'Life-Saving Rules', icon: BookOpen },
          { id: 'trends', label: 'Temporal Trends', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DimensionTab)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.82rem',
                padding: '7px 14px',
                borderRadius: '8px',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchAllAnalytics(false)} />}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* ============================================================
                TAB 1: SITES & LOCATIONS (PRIMARY VIEW)
               ============================================================ */}
            {activeTab === 'sites' && (
              <>
                {/* PRIMARY CHART CARD: Horizontal Ranked Bar Chart */}
                <div className="card" style={{ padding: '24px 28px' }}>
                  {/* Chart Header & Controls */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '20px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        {siteMetric === 'density'
                          ? 'SIF Precursor Density by Facility'
                          : siteMetric === 'sif_count'
                          ? 'SIF Precursor Count by Facility'
                          : 'Total Incident Reports by Facility'}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Facilities ranked by {siteMetric === 'density' ? 'precursor concentration ratio' : siteMetric === 'sif_count' ? 'precursor count' : 'total report volume'}
                      </p>
                    </div>

                    {/* Chart Contextual Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Metric Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-elevated)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => setSiteMetric('density')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: siteMetric === 'density' ? 'var(--primary)' : 'transparent',
                            color: siteMetric === 'density' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          SIF Density (%)
                        </button>
                        <button
                          onClick={() => setSiteMetric('sif_count')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: siteMetric === 'sif_count' ? 'var(--primary)' : 'transparent',
                            color: siteMetric === 'sif_count' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          SIF Precursors
                        </button>
                        <button
                          onClick={() => setSiteMetric('total_reports')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: siteMetric === 'total_reports' ? 'var(--primary)' : 'transparent',
                            color: siteMetric === 'total_reports' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Total Reports
                        </button>
                      </div>

                      {/* Limit Selector */}
                      <select
                        value={siteLimit}
                        onChange={(e) => setSiteLimit(Number(e.target.value))}
                        style={{
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-main)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value={0}>All Facilities</option>
                      </select>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('explorer')}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.78rem', padding: '6px 10px', color: 'var(--primary-bright)' }}
                          title="Open in Incident Explorer"
                        >
                          <span>Explorer</span>
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Container */}
                  <div
                    style={{
                      height: `${Math.min(420, Math.max(280, siteChartData.length * 36 + 40))}px`,
                      width: '100%',
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={siteChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 30, left: 160, bottom: 8 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          vertical={true}
                          stroke="var(--border-subtle)"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
                          tickFormatter={(val) => `${val}${siteMetric === 'density' ? '%' : ''}`}
                          domain={[0, 'auto']}
                        />
                        <YAxis
                          type="category"
                          dataKey="displayName"
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 12, fontFamily: 'var(--font-main)', fill: 'var(--text-primary)', fontWeight: 500 }}
                          width={160}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomRankedTooltip metricType={siteMetric} />} cursor={{ fill: 'rgba(255, 106, 0, 0.04)' }} />
                        <Bar dataKey="displayValue" radius={[0, 6, 6, 0]} barSize={20}>
                          {siteChartData.map((entry, index) => {
                            let fill = '#C6530A';
                            if (index === 0 && entry.displayValue > 0) {
                              fill = '#FF6A00'; // Visual dominant top facility
                            } else if (entry.displayValue === 0) {
                              fill = '#71300C'; // Inactive/zero muted
                            } else if (index < 3 && entry.displayValue > 0) {
                              fill = '#D95B0B';
                            }
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* KEY INSIGHT CARD (Data-driven) */}
                <div
                  className="card"
                  style={{
                    padding: '18px 24px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '850px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 106, 0, 0.12)',
                        border: '1px solid rgba(255, 106, 0, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          ● Key Operational Insight
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                        {topSite && topSite.sif_count > 0 ? (
                          <>
                            <strong style={{ color: 'var(--primary-bright)' }}>{topSite.site}</strong> currently shows the highest SIF precursor density at{' '}
                            <strong style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{(topSite.sif_density * 100).toFixed(1)}%</strong>{' '}
                            ({topSite.sif_count} precursors out of {topSite.total_reports} reports).{' '}
                            {kpis.highRiskSites > 1
                              ? `${kpis.highRiskSites} facilities require active barrier triage.`
                              : 'Recommended focus: safety barrier verification and isolation protocol auditing.'}
                          </>
                        ) : (
                          'No elevated SIF precursor hotspots detected across monitored facilities. Precursor distribution remains balanced.'
                        )}
                      </p>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('review')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Triage Queue</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {/* FACILITY INTELLIGENCE TABLE (Dedicated Separate Card) */}
                <div className="card" style={{ padding: '24px 28px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          Facility Intelligence
                        </h3>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            background: 'var(--surface-elevated)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {filteredSites.length} monitored
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Telemetry metrics and SIF risk classification per operational asset
                      </p>
                    </div>

                    {/* Table Search Input */}
                    <div style={{ position: 'relative', width: '240px' }}>
                      <Search
                        size={14}
                        color="var(--text-muted)"
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        type="text"
                        placeholder="Filter facilities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 12px 7px 30px',
                          borderRadius: '8px',
                          background: 'var(--background-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Facility</th>
                          <th style={{ textAlign: 'right' }}>Total Reports</th>
                          <th style={{ textAlign: 'right' }}>SIF Precursors</th>
                          <th style={{ width: '200px' }}>Precursor Density</th>
                          <th style={{ textAlign: 'center' }}>Risk Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSites.length > 0 ? (
                          filteredSites.map((s, idx) => {
                            const isHigh = s.sif_density >= 0.10 || s.sif_count >= 4;
                            const isMed = s.sif_density > 0 || s.sif_count > 0;
                            const pct = (s.sif_density * 100).toFixed(1);

                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {s.site || 'Unknown Location'}
                                </td>
                                <td
                                  style={{
                                    textAlign: 'right',
                                    fontFamily: 'var(--font-mono)',
                                    fontVariantNumeric: 'tabular-nums',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {s.total_reports}
                                </td>
                                <td
                                  style={{
                                    textAlign: 'right',
                                    fontFamily: 'var(--font-mono)',
                                    fontVariantNumeric: 'tabular-nums',
                                    color: s.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)',
                                    fontWeight: s.sif_count > 0 ? 700 : 400,
                                  }}
                                >
                                  {s.sif_count}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        flex: 1,
                                        height: '6px',
                                        background: 'var(--surface-elevated)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${Math.min(100, Math.max(0, s.sif_density * 100))}%`,
                                          height: '100%',
                                          background: isHigh
                                            ? 'var(--danger)'
                                            : isMed
                                            ? 'var(--primary)'
                                            : 'var(--text-muted)',
                                          borderRadius: '3px',
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontVariantNumeric: 'tabular-nums',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: isHigh ? 'var(--danger)' : isMed ? 'var(--text-primary)' : 'var(--text-muted)',
                                        minWidth: '45px',
                                        textAlign: 'right',
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {isHigh ? (
                                    <span
                                      className="badge badge-sif"
                                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                    >
                                      HIGH
                                    </span>
                                  ) : isMed ? (
                                    <span
                                      className="badge badge-uncertain"
                                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                    >
                                      MEDIUM
                                    </span>
                                  ) : (
                                    <span
                                      className="badge badge-nonsif"
                                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                    >
                                      LOW
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                              No facilities matching &quot;{searchQuery}&quot;
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================
                TAB 2: ACTIVITIES & TASKS
               ============================================================ */}
            {activeTab === 'activities' && (
              <>
                <div className="card" style={{ padding: '24px 28px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '20px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        Operational Task Precursor Distribution
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        High-risk activities ranked by {activityMetric === 'density' ? 'precursor density' : 'precursor count'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-elevated)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
                      <button
                        onClick={() => setActivityMetric('density')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: activityMetric === 'density' ? 'var(--primary)' : 'transparent',
                          color: activityMetric === 'density' ? '#FFFFFF' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Density (%)
                      </button>
                      <button
                        onClick={() => setActivityMetric('sif_count')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: activityMetric === 'sif_count' ? 'var(--primary)' : 'transparent',
                          color: activityMetric === 'sif_count' ? '#FFFFFF' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        SIF Count
                      </button>
                    </div>
                  </div>

                  <div style={{ height: `${Math.min(420, Math.max(280, activityChartData.length * 36 + 40))}px`, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activityChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 30, left: 160, bottom: 8 }}
                      >
                        <CartesianGrid horizontal={false} vertical={true} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
                          tickFormatter={(val) => `${val}${activityMetric === 'density' ? '%' : ''}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="displayName"
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 12, fontFamily: 'var(--font-main)', fill: 'var(--text-primary)', fontWeight: 500 }}
                          width={160}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomRankedTooltip metricType={activityMetric} />} cursor={{ fill: 'rgba(255, 106, 0, 0.04)' }} />
                        <Bar dataKey="displayValue" radius={[0, 6, 6, 0]} barSize={20}>
                          {activityChartData.map((entry, index) => (
                            <Cell
                              key={`act-${index}`}
                              fill={index === 0 && entry.displayValue > 0 ? '#FF6A00' : entry.displayValue === 0 ? '#71300C' : '#C6530A'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity Intelligence Table */}
                <div className="card" style={{ padding: '24px 28px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Activity Breakdown
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Activity / Work Scope</th>
                          <th style={{ textAlign: 'right' }}>Total Reports</th>
                          <th style={{ textAlign: 'right' }}>SIF Precursors</th>
                          <th style={{ width: '200px' }}>Density</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityData.map((a, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{a.activity}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                              {a.total_reports}
                            </td>
                            <td style={{ textAlign: 'right', color: a.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                              {a.sif_count}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${Math.min(100, Math.max(0, a.sif_density * 100))}%`,
                                      height: '100%',
                                      background: a.sif_density > 0.1 ? 'var(--danger)' : 'var(--primary)',
                                    }}
                                  />
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600 }}>
                                  {(a.sif_density * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================
                TAB 3: RECURRING HAZARDS
               ============================================================ */}
            {activeTab === 'hazards' && (
              <div className="card" style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Recurring Precursor Hazards
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Dominant hazard classifications associated with high potential incident energy
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hazard Identification</th>
                        <th style={{ textAlign: 'right' }}>Total Reports</th>
                        <th style={{ textAlign: 'right' }}>SIF Precursors</th>
                        <th style={{ width: '200px' }}>Density</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hazardData.map((h, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-bright)' }}>{h.hazard}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.total_reports}</td>
                          <td style={{ textAlign: 'right', color: h.sif_count > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.sif_count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, h.sif_density * 100))}%`, height: '100%', background: 'var(--primary)' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600 }}>
                                {(h.sif_density * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 4: BARRIER FAILURES
               ============================================================ */}
            {activeTab === 'barriers' && (
              <div className="card" style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Failed, Missing, or Bypassed Safety Barriers
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Safety barriers whose absence or degradation allowed precursor escalation
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Barrier Failure Defect</th>
                        <th style={{ textAlign: 'right' }}>Total Reports</th>
                        <th style={{ textAlign: 'right' }}>SIF Precursors</th>
                        <th style={{ width: '200px' }}>Density</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barrierData.map((b, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{b.barrier_failure}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.total_reports}</td>
                          <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.sif_count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, b.sif_density * 100))}%`, height: '100%', background: 'var(--danger)' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger)' }}>
                                {(b.sif_density * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 5: LIFE-SAVING RULES
               ============================================================ */}
            {activeTab === 'lsr' && (
              <div className="card" style={{ padding: '24px 28px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  IOGP Life-Saving Rules Implication Distribution
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Distribution of precursor occurrences matched against standard IOGP 9 Life-Saving Rules
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Life-Saving Rule Name</th>
                        <th style={{ textAlign: 'right' }}>Incident Matches</th>
                        <th style={{ width: '220px' }}>Share of Precursors (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lsrData.map((lsr, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-bright)' }}>{lsr.rule_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{lsr.count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, lsr.percentage))}%`, height: '100%', background: 'var(--primary)' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600 }}>
                                {lsr.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                TAB 6: TEMPORAL TRENDS
               ============================================================ */}
            {activeTab === 'trends' && (
              <>
                <div className="card" style={{ padding: '24px 28px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '14px',
                      marginBottom: '20px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        Temporal Precursor Trajectory
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Chronological trend of SIF precursors vs total reported volume
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setTrendGrouping('month')}
                        className={`btn ${trendGrouping === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setTrendGrouping('quarter')}
                        className={`btn ${trendGrouping === 'quarter' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                      >
                        Quarterly
                      </button>
                    </div>
                  </div>

                  <div style={{ height: '340px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorSif" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                        <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }} />
                        <Tooltip content={<CustomRankedTooltip metricType="trends" />} />
                        <Area type="monotone" dataKey="total_reports" name="Total Reports" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                        <Area type="monotone" dataKey="sif_precursors" name="SIF Precursors" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorSif)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend Table */}
                <div className="card" style={{ padding: '24px 28px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Temporal Metrics Breakdown
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th style={{ textAlign: 'right' }}>Total Reports</th>
                          <th style={{ textAlign: 'right' }}>SIF Precursors</th>
                          <th style={{ textAlign: 'right' }}>Density</th>
                          <th style={{ textAlign: 'right' }}>Change</th>
                          <th style={{ textAlign: 'center' }}>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.map((t, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{t.period}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{t.total_reports}</td>
                            <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{t.sif_precursors}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{(t.sif_density * 100).toFixed(1)}%</td>
                            <td style={{ textAlign: 'right', color: t.percentage_change > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                              {t.percentage_change > 0 ? `+${t.percentage_change}%` : `${t.percentage_change}%`}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={t.trend === 'INCREASE' ? 'badge badge-sif' : 'badge badge-nonsif'}>
                                {t.trend}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};
