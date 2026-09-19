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
import { InsightChartWrapper } from '../components/charts/InsightChartWrapper';

interface Props {
  onNavigate?: (tab: TabId) => void;
}

type DimensionTab = 'sites' | 'activities' | 'hazards' | 'barriers' | 'lsr' | 'trends';
type MetricChoice = 'density' | 'sif_count' | 'total_reports';

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

  const siteChartOption = useMemo(() => {
    const categories = siteChartData.map((s) => s.displayName);
    const dataValues = siteChartData.map((s) => s.displayValue);

    return {
      grid: {
        left: '2%',
        right: '14%',
        bottom: '3%',
        top: '6%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const item = params[0];
          const entry = siteChartData[item.dataIndex];
          if (!entry) return '';
          const isHigh = entry.sif_density >= 0.10 || entry.sif_count >= 2;
          const isMed = entry.sif_density > 0 || entry.sif_count > 0;
          const badgeBg = isHigh ? 'rgba(244, 63, 94, 0.18)' : isMed ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)';
          const badgeColor = isHigh ? '#F43F5E' : isMed ? '#F59E0B' : '#10B981';
          const badgeText = isHigh ? 'CRITICAL RISK' : isMed ? 'ELEVATED' : 'NOMINAL';

          return `
            <div style="font-weight:700;font-size:13px;color:#F4F3EE;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px;">
              <span>${entry.displayName}</span>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${badgeBg};color:${badgeColor};font-weight:700;font-family:var(--font-mono);">${badgeText}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;font-size:12px;">
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;">
                <span>SIF Precursors:</span>
                <strong style="color:${entry.sif_count > 0 ? '#F43F5E' : '#F4F3EE'};font-family:var(--font-mono);">${entry.sif_count}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;">
                <span>Total Reports:</span>
                <strong style="color:#F4F3EE;font-family:var(--font-mono);">${entry.total_reports}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:4px;">
                <span>Precursor Density:</span>
                <strong style="color:#F59E0B;font-family:var(--font-mono);">${(entry.sif_density * 100).toFixed(1)}%</strong>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#9CA8AA',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          formatter: (val: number) => `${val}${siteMetric === 'density' ? '%' : ''}`,
        },
        splitLine: {
          lineStyle: { color: '#203238', type: 'dashed' },
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#203238' } },
        axisLabel: {
          color: '#F4F3EE',
          fontSize: 12,
          fontWeight: 500,
          width: 140,
          overflow: 'truncate',
        },
      },
      series: [
        {
          name: siteMetric === 'density' ? 'SIF Density (%)' : siteMetric === 'sif_count' ? 'SIF Precursors' : 'Total Reports',
          type: 'bar',
          data: dataValues,
          barMaxWidth: 20,
          itemStyle: {
            color: (params: any) => {
              const entry = siteChartData[params.dataIndex];
              if (!entry) return '#334155';
              if (entry.sif_density >= 0.10 || entry.sif_count >= 2) {
                return '#F43F5E'; // Laser Ruby
              }
              if (entry.sif_count > 0 || entry.sif_density > 0) {
                return '#F59E0B'; // Sunburst Champagne
              }
              return '#334155'; // Titanium Slate
            },
            borderRadius: [0, 6, 6, 0],
          },
          label: {
            show: true,
            position: 'right',
            distance: 8,
            formatter: (params: any) => {
              const entry = siteChartData[params.dataIndex];
              if (!entry) return '';
              if (siteMetric === 'density') {
                return `${params.value}% (${entry.sif_count} SIF)`;
              }
              if (siteMetric === 'sif_count') {
                return `${params.value} (${(entry.sif_density * 100).toFixed(1)}%)`;
              }
              return `${params.value}`;
            },
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: '#9CA8AA',
          },
        },
      ],
    };
  }, [siteChartData, siteMetric]);

  const activityChartOption = useMemo(() => {
    const categories = activityChartData.map((a) => a.displayName);
    const dataValues = activityChartData.map((a) => a.displayValue);

    return {
      grid: {
        left: '2%',
        right: '14%',
        bottom: '3%',
        top: '6%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const item = params[0];
          const entry = activityChartData[item.dataIndex];
          if (!entry) return '';
          const isHigh = entry.sif_density >= 0.10 || entry.sif_count >= 2;
          const isMed = entry.sif_density > 0 || entry.sif_count > 0;
          const badgeBg = isHigh ? 'rgba(244, 63, 94, 0.18)' : isMed ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)';
          const badgeColor = isHigh ? '#F43F5E' : isMed ? '#F59E0B' : '#10B981';
          const badgeText = isHigh ? 'CRITICAL TASK' : isMed ? 'ELEVATED' : 'NOMINAL';

          return `
            <div style="font-weight:700;font-size:13px;color:#F4F3EE;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px;">
              <span>${entry.displayName}</span>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${badgeBg};color:${badgeColor};font-weight:700;font-family:var(--font-mono);">${badgeText}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;font-size:12px;">
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;">
                <span>SIF Precursors:</span>
                <strong style="color:${entry.sif_count > 0 ? '#F43F5E' : '#F4F3EE'};font-family:var(--font-mono);">${entry.sif_count}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;">
                <span>Total Reports:</span>
                <strong style="color:#F4F3EE;font-family:var(--font-mono);">${entry.total_reports}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;color:#9CA8AA;gap:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:4px;">
                <span>Precursor Density:</span>
                <strong style="color:#F59E0B;font-family:var(--font-mono);">${(entry.sif_density * 100).toFixed(1)}%</strong>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#9CA8AA',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          formatter: (val: number) => `${val}${activityMetric === 'density' ? '%' : ''}`,
        },
        splitLine: {
          lineStyle: { color: '#203238', type: 'dashed' },
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#203238' } },
        axisLabel: {
          color: '#F4F3EE',
          fontSize: 12,
          fontWeight: 500,
          width: 140,
          overflow: 'truncate',
        },
      },
      series: [
        {
          name: activityMetric === 'density' ? 'SIF Density (%)' : activityMetric === 'sif_count' ? 'SIF Precursors' : 'Total Reports',
          type: 'bar',
          data: dataValues,
          barMaxWidth: 20,
          itemStyle: {
            color: (params: any) => {
              const entry = activityChartData[params.dataIndex];
              if (!entry) return '#334155';
              if (entry.sif_density >= 0.10 || entry.sif_count >= 2) {
                return '#F43F5E';
              }
              if (entry.sif_count > 0 || entry.sif_density > 0) {
                return '#F59E0B';
              }
              return '#334155';
            },
            borderRadius: [0, 6, 6, 0],
          },
          label: {
            show: true,
            position: 'right',
            distance: 8,
            formatter: (params: any) => {
              const entry = activityChartData[params.dataIndex];
              if (!entry) return '';
              if (activityMetric === 'density') {
                return `${params.value}% (${entry.sif_count} SIF)`;
              }
              if (activityMetric === 'sif_count') {
                return `${params.value} (${(entry.sif_density * 100).toFixed(1)}%)`;
              }
              return `${params.value}`;
            },
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: '#9CA8AA',
          },
        },
      ],
    };
  }, [activityChartData, activityMetric]);

  const trendChartOption = useMemo(() => {
    const periods = trendData.map((d) => d.period);
    const totalReports = trendData.map((d) => d.total_reports);
    const sifPrecursors = trendData.map((d) => d.sif_precursors);
    const sifDensity = trendData.map((d) => Math.round(d.sif_density * 100));
    const isSparse = periods.length <= 2;

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '16%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const periodName = params[0].name;
          let html = `<div style="font-weight:700;font-size:13px;color:#F4F3EE;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;">Period: ${periodName}</div>`;
          params.forEach((item) => {
            const isDensity = item.seriesName.includes('Density');
            const val = isDensity ? `${item.value}%` : item.value;
            html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;margin-top:4px;">
              <span style="display:flex;align-items:center;gap:6px;color:#9CA8AA;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};"></span>
                ${item.seriesName}
              </span>
              <span style="font-weight:700;font-family:var(--font-mono);color:#F4F3EE;">${val}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['Total Reports', 'SIF Precursors', 'SIF Precursor Density (%)'],
        textStyle: { color: '#9CA8AA', fontSize: 11 },
        top: 0,
        right: 0,
      },
      xAxis: {
        type: 'category',
        data: periods.length ? periods : ['Current Period'],
        axisPointer: { type: 'shadow' },
        axisLine: { lineStyle: { color: '#203238' } },
        axisLabel: { color: '#9CA8AA', fontSize: 11, fontFamily: 'var(--font-mono)' },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Reports',
          min: 0,
          axisLabel: { color: '#9CA8AA', fontSize: 11 },
          splitLine: { lineStyle: { color: '#203238', type: 'dashed' } },
        },
        {
          type: 'value',
          name: 'Density (%)',
          min: 0,
          max: 100,
          axisLabel: { color: '#9CA8AA', formatter: '{value}%', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Total Reports',
          type: 'bar',
          barMaxWidth: isSparse ? 36 : 26,
          itemStyle: {
            color: '#334155', // Titanium Slate
            borderColor: '#475569',
            borderWidth: 1,
            borderRadius: [4, 4, 0, 0],
          },
          data: totalReports,
        },
        {
          name: 'SIF Precursors',
          type: 'bar',
          barMaxWidth: isSparse ? 36 : 26,
          itemStyle: {
            color: '#F43F5E', // Laser Ruby
            borderRadius: [4, 4, 0, 0],
          },
          data: sifPrecursors,
        },
        {
          name: 'SIF Precursor Density (%)',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#F59E0B', // Sunburst Champagne
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
          lineStyle: { width: 3, color: '#F59E0B' },
          data: sifDensity,
        },
      ],
    };
  }, [trendData]);

  const latestTrend = useMemo(() => {
    if (!trendData.length) return null;
    return trendData[trendData.length - 1];
  }, [trendData]);

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                {/* PRIMARY CHART CARD: ECharts Horizontal Ranked Bar Chart */}
                <InsightChartWrapper
                  title={
                    siteMetric === 'density'
                      ? 'SIF Precursor Density by Facility'
                      : siteMetric === 'sif_count'
                      ? 'SIF Precursor Count by Facility'
                      : 'Total Incident Reports by Facility'
                  }
                  subtitle={`Facilities ranked by ${
                    siteMetric === 'density'
                      ? 'precursor concentration ratio'
                      : siteMetric === 'sif_count'
                      ? 'precursor count'
                      : 'total report volume'
                  }`}
                  option={siteChartOption}
                  height={Math.min(460, Math.max(300, siteChartData.length * 36 + 40))}
                  empty={siteChartData.length === 0}
                  emptyMessage="No facility safety signals recorded."
                  onChartClick={() => onNavigate && onNavigate('explorer')}
                  headerAction={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {topSite && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: '#F43F5E',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Hotspot: {topSite.site || 'Unknown'} ({(topSite.sif_density * 100).toFixed(1)}%)
                        </span>
                      )}

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
                  }
                />

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
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F43F5E',
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
                            color: '#F43F5E',
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
                            <strong style={{ color: '#F43F5E' }}>{topSite.site}</strong> currently shows the highest SIF precursor density at{' '}
                            <strong style={{ color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>{(topSite.sif_density * 100).toFixed(1)}%</strong>{' '}
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
                                            ? '#F43F5E'
                                            : isMed
                                            ? '#F59E0B'
                                            : '#334155',
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
                                        color: isHigh ? '#F43F5E' : isMed ? '#F59E0B' : 'var(--text-muted)',
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
                <InsightChartWrapper
                  title="Operational Task Precursor Distribution"
                  subtitle={`High-risk activities ranked by ${activityMetric === 'density' ? 'precursor density' : 'precursor count'}`}
                  option={activityChartOption}
                  height={Math.min(460, Math.max(300, activityChartData.length * 36 + 40))}
                  empty={activityChartData.length === 0}
                  emptyMessage="No activity safety signals recorded."
                  onChartClick={() => onNavigate && onNavigate('explorer')}
                  headerAction={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {sortedActivities[0] && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: '#F43F5E',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          Priority: {sortedActivities[0].activity}
                        </span>
                      )}

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
                  }
                />

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
                            <td style={{ textAlign: 'right', color: a.sif_count > 0 ? '#F43F5E' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                              {a.sif_count}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${Math.min(100, Math.max(0, a.sif_density * 100))}%`,
                                      height: '100%',
                                      background: a.sif_density >= 0.1 ? '#F43F5E' : a.sif_density > 0 ? '#F59E0B' : '#10B981',
                                      borderRadius: '3px',
                                    }}
                                  />
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600, color: a.sif_density >= 0.1 ? '#F43F5E' : a.sif_density > 0 ? '#F59E0B' : 'var(--text-secondary)' }}>
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
                          <td style={{ fontWeight: 600, color: h.sif_count > 0 ? '#F43F5E' : 'var(--text-primary)' }}>{h.hazard}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.total_reports}</td>
                          <td style={{ textAlign: 'right', color: h.sif_count > 0 ? '#F43F5E' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{h.sif_count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, h.sif_density * 100))}%`, height: '100%', background: h.sif_density >= 0.1 ? '#F43F5E' : h.sif_density > 0 ? '#F59E0B' : '#10B981', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600, color: h.sif_density >= 0.1 ? '#F43F5E' : h.sif_density > 0 ? '#F59E0B' : 'var(--text-secondary)' }}>
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
                          <td style={{ fontWeight: 600, color: '#F43F5E' }}>{b.barrier_failure}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.total_reports}</td>
                          <td style={{ textAlign: 'right', color: '#F43F5E', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{b.sif_count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, b.sif_density * 100))}%`, height: '100%', background: '#F43F5E', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600, color: '#F43F5E' }}>
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
                          <td style={{ fontWeight: 600, color: lsr.percentage >= 20 ? '#F43F5E' : 'var(--text-primary)' }}>{lsr.rule_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{lsr.count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.max(0, lsr.percentage))}%`, height: '100%', background: lsr.percentage >= 20 ? '#F43F5E' : lsr.percentage >= 10 ? '#F59E0B' : '#334155', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 600, color: lsr.percentage >= 20 ? '#F43F5E' : lsr.percentage >= 10 ? '#F59E0B' : 'var(--text-secondary)' }}>
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
                <InsightChartWrapper
                  title="Temporal Precursor Trajectory"
                  subtitle="Chronological trend of SIF precursors vs total reported volume with precursor density."
                  option={trendChartOption}
                  height={340}
                  empty={trendData.length === 0}
                  emptyMessage="No temporal safety signals recorded."
                  headerAction={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {latestTrend && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: '#F43F5E',
                              background: 'rgba(244, 63, 94, 0.12)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {latestTrend.sif_precursors} SIF Precursors
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {(latestTrend.sif_density * 100).toFixed(1)}% Density
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-elevated)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
                        <button
                          onClick={() => setTrendGrouping('month')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: trendGrouping === 'month' ? 'var(--primary)' : 'transparent',
                            color: trendGrouping === 'month' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setTrendGrouping('quarter')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: trendGrouping === 'quarter' ? 'var(--primary)' : 'transparent',
                            color: trendGrouping === 'quarter' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Quarterly
                        </button>
                      </div>
                    </div>
                  }
                />
                {trendData.length === 1 && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      background: 'rgba(51, 65, 85, 0.25)',
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Sparkles size={15} color="#F59E0B" />
                    <span>
                      Aggregated telemetry for <strong>{trendData[0].period}</strong>. Multi-period comparison trajectory will render as more periods accumulate.
                    </span>
                  </div>
                )}

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
                            <td style={{ textAlign: 'right', color: t.sif_precursors > 0 ? '#F43F5E' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{t.sif_precursors}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{(t.sif_density * 100).toFixed(1)}%</td>
                            <td style={{ textAlign: 'right', color: t.percentage_change > 0 ? '#F43F5E' : 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
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
