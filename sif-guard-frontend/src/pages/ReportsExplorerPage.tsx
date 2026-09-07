import React, { useState, useEffect, useRef, useMemo } from 'react';
import { listReports, analyzeReport } from '../api/reports';
import { getSimilarReports } from '../api/patterns';
import type { SafetyReportRead, AnalysisResponse, SimilarReport } from '../types/api';
import { SIFBadge } from '../components/common/SIFBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { EmptyState } from '../components/common/EmptyState';
import { EvidenceHighlighter } from '../components/common/EvidenceHighlighter';
import { AIExplanationPanel } from '../components/common/AIExplanationPanel';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Play,
  Eye,
  Layers,
  X,
  Sparkles,
  Download,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Database,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import type { TabId } from '../components/layout/Navigation';

interface Props {
  onNavigate: (tab: TabId) => void;
}

type SortField = 'priority' | 'confidence' | 'site' | 'activity' | 'hazard' | 'id';
type ViewMode = 'ALL' | 'PRIORITY' | 'SIF_ONLY' | 'UNCERTAIN_ONLY';

export const ReportsExplorerPage: React.FC<Props> = ({ onNavigate }) => {
  const [reports, setReports] = useState<SafetyReportRead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sifFilter, setSifFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [hazardFilter, setHazardFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');

  // Sorting & Pagination state
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Selected Report Detail Drawer
  const [selectedReport, setSelectedReport] = useState<SafetyReportRead | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [similarReports, setSimilarReports] = useState<SimilarReport[]>([]);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);

    listReports(0, 500, sourceFilter === 'ALL' ? undefined : sourceFilter, sifFilter === 'ALL' ? undefined : sifFilter)
      .then((data) => {
        setReports(data);
        setLastSyncTime(new Date());
        setIsRefreshing(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch reports');
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    listReports(0, 500, sourceFilter === 'ALL' ? undefined : sourceFilter, sifFilter === 'ALL' ? undefined : sifFilter)
      .then((data) => {
        if (!isMounted) return;
        setReports(data);
        setLastSyncTime(new Date());
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch reports');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sifFilter, sourceFilter]);

  // Global Keyboard Shortcuts: '/' focuses search, 'Escape' closes detail drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedReport) {
          setSelectedReport(null);
        }
      } else if (e.key === '/' && !selectedReport && document.activeElement !== searchInputRef.current) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReport]);

  // Dynamic unique lists derived from live records
  const uniqueSites = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const siteName = (r.site || r.employer || '').trim();
      if (siteName) set.add(siteName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const uniqueHazards = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const h = (r.hazard || '').trim();
      if (h) set.add(h);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reports]);

  // KPI Calculations strictly from loaded dataset (zero fake metrics)
  const stats = useMemo(() => {
    const total = reports.length;
    const sifCount = reports.filter((r) => r.sif_potential === 'SIF_POTENTIAL').length;
    const uncertainCount = reports.filter((r) => r.sif_potential === 'UNCERTAIN').length;
    const nonSifCount = reports.filter((r) => r.sif_potential === 'NON_SIF').length;
    const highPriorityCount = reports.filter(
      (r) =>
        r.sif_potential === 'SIF_POTENTIAL' &&
        ((r.sif_confidence || r.sif_score || 0) >= 0.8 || Boolean(r.barrier_failure))
    ).length;
    const barrierDefectCount = reports.filter((r) => Boolean(r.barrier_failure)).length;
    const sifDensity = total > 0 ? (sifCount / total) * 100 : 0;

    return {
      total,
      sifCount,
      uncertainCount,
      nonSifCount,
      highPriorityCount,
      barrierDefectCount,
      sifDensity,
    };
  }, [reports]);

  // Filtered reports pipeline
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          r.report_text.toLowerCase().includes(q) ||
          (r.activity && r.activity.toLowerCase().includes(q)) ||
          (r.hazard && r.hazard.toLowerCase().includes(q)) ||
          (r.site && r.site.toLowerCase().includes(q)) ||
          (r.employer && r.employer.toLowerCase().includes(q)) ||
          (r.barrier_failure && r.barrier_failure.toLowerCase().includes(q)) ||
          (r.energy_source && r.energy_source.toLowerCase().includes(q)) ||
          (r.source_record_id && r.source_record_id.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // 2. Site Filter
      if (siteFilter !== 'ALL') {
        const rSite = (r.site || r.employer || '').trim();
        if (rSite !== siteFilter) return false;
      }

      // 3. Hazard Filter
      if (hazardFilter !== 'ALL') {
        const rHazard = (r.hazard || '').trim();
        if (rHazard !== hazardFilter) return false;
      }

      // 4. View Mode
      if (viewMode === 'PRIORITY') {
        const isPriority =
          r.sif_potential === 'SIF_POTENTIAL' &&
          ((r.sif_confidence || r.sif_score || 0) >= 0.8 || Boolean(r.barrier_failure));
        if (!isPriority) return false;
      } else if (viewMode === 'SIF_ONLY') {
        if (r.sif_potential !== 'SIF_POTENTIAL') return false;
      } else if (viewMode === 'UNCERTAIN_ONLY') {
        if (r.sif_potential !== 'UNCERTAIN') return false;
      }

      return true;
    });
  }, [reports, searchQuery, siteFilter, hazardFilter, viewMode]);

  // Sorted reports pipeline
  const sortedReports = useMemo(() => {
    const list = [...filteredReports];
    return list.sort((a, b) => {
      if (sortBy === 'priority') {
        // High priority SIF precursors with barrier defects first
        const aScore =
          (a.sif_potential === 'SIF_POTENTIAL' ? 2 : a.sif_potential === 'UNCERTAIN' ? 1 : 0) * 100 +
          (a.barrier_failure ? 30 : 0) +
          (a.sif_confidence || a.sif_score || 0) * 50;
        const bScore =
          (b.sif_potential === 'SIF_POTENTIAL' ? 2 : b.sif_potential === 'UNCERTAIN' ? 1 : 0) * 100 +
          (b.barrier_failure ? 30 : 0) +
          (b.sif_confidence || b.sif_score || 0) * 50;
        return sortDirection === 'asc' ? aScore - bScore : bScore - aScore;
      }

      if (sortBy === 'confidence') {
        const aConf = a.sif_confidence || a.sif_score || 0;
        const bConf = b.sif_confidence || b.sif_score || 0;
        return sortDirection === 'asc' ? aConf - bConf : bConf - aConf;
      }

      if (sortBy === 'site') {
        const aSite = a.site || a.employer || '';
        const bSite = b.site || b.employer || '';
        return sortDirection === 'asc' ? aSite.localeCompare(bSite) : bSite.localeCompare(aSite);
      }

      if (sortBy === 'activity') {
        const aAct = a.activity || '';
        const bAct = b.activity || '';
        return sortDirection === 'asc' ? aAct.localeCompare(bAct) : bAct.localeCompare(aAct);
      }

      if (sortBy === 'hazard') {
        const aHaz = a.hazard || '';
        const bHaz = b.hazard || '';
        return sortDirection === 'asc' ? aHaz.localeCompare(bHaz) : bHaz.localeCompare(aHaz);
      }

      if (sortBy === 'id') {
        return sortDirection === 'asc'
          ? a.source_record_id.localeCompare(b.source_record_id)
          : b.source_record_id.localeCompare(a.source_record_id);
      }

      return 0;
    });
  }, [filteredReports, sortBy, sortDirection]);

  // Paginated slice with automatic bounds safety
  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedReports = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedReports.slice(startIndex, startIndex + pageSize);
  }, [sortedReports, safeCurrentPage, pageSize]);

  // Active filters count and list for chips
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; value: string; clear: () => void }[] = [];

    if (searchQuery.trim()) {
      list.push({
        key: 'search',
        label: 'Search',
        value: `"${searchQuery.trim()}"`,
        clear: () => setSearchQuery(''),
      });
    }

    if (viewMode !== 'ALL') {
      const modeLabel =
        viewMode === 'PRIORITY'
          ? 'High Priority'
          : viewMode === 'SIF_ONLY'
          ? 'SIF Signals Only'
          : 'Uncertain Only';
      list.push({
        key: 'viewMode',
        label: 'View',
        value: modeLabel,
        clear: () => setViewMode('ALL'),
      });
    }

    if (sifFilter !== 'ALL') {
      const sifLabels: Record<string, string> = {
        SIF_POTENTIAL: 'SIF Precursors',
        NON_SIF: 'Non-SIF',
        UNCERTAIN: 'Uncertain',
      };
      list.push({
        key: 'sif',
        label: 'Classification',
        value: sifLabels[sifFilter] || sifFilter,
        clear: () => setSifFilter('ALL'),
      });
    }

    if (sourceFilter !== 'ALL') {
      list.push({
        key: 'source',
        label: 'Source',
        value: sourceFilter,
        clear: () => setSourceFilter('ALL'),
      });
    }

    if (siteFilter !== 'ALL') {
      list.push({
        key: 'site',
        label: 'Site',
        value: siteFilter,
        clear: () => setSiteFilter('ALL'),
      });
    }

    if (hazardFilter !== 'ALL') {
      list.push({
        key: 'hazard',
        label: 'Hazard',
        value: hazardFilter,
        clear: () => setHazardFilter('ALL'),
      });
    }

    return list;
  }, [searchQuery, viewMode, sifFilter, sourceFilter, siteFilter, hazardFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSifFilter('ALL');
    setSourceFilter('ALL');
    setSiteFilter('ALL');
    setHazardFilter('ALL');
    setViewMode('ALL');
  };

  const handleOpenReport = (report: SafetyReportRead) => {
    setSelectedReport(report);
    setAnalysisData(null);
    setSimilarReports([]);

    if (!report.sif_potential) {
      handleRunAnalysis(report.id);
    } else {
      getSimilarReports(report.id, 4)
        .then((res) => setSimilarReports(res.similar_reports))
        .catch(() => {});
    }
  };

  const handleRunAnalysis = (reportId: string) => {
    setAnalyzing(true);
    analyzeReport(reportId)
      .then((res) => {
        setAnalysisData(res);
        setAnalyzing(false);
        handleRefresh();
        getSimilarReports(reportId, 4)
          .then((sim) => setSimilarReports(sim.similar_reports))
          .catch(() => {});
      })
      .catch(() => {
        setAnalyzing(false);
      });
  };

  // Step through reports in drawer
  const selectedIndex = useMemo(() => {
    if (!selectedReport) return -1;
    return sortedReports.findIndex((r) => r.id === selectedReport.id);
  }, [selectedReport, sortedReports]);

  const handleNavigateDrawer = (delta: number) => {
    if (selectedIndex === -1) return;
    const nextIdx = selectedIndex + delta;
    if (nextIdx >= 0 && nextIdx < sortedReports.length) {
      handleOpenReport(sortedReports[nextIdx]);
    }
  };

  const exportFilteredCSV = () => {
    if (sortedReports.length === 0) return;
    const headers = [
      'Record ID',
      'Source Dataset',
      'Site / Employer',
      'Activity / Task',
      'Hazard',
      'Barrier Failure',
      'SIF Classification',
      'SIF Confidence',
      'Energy Source',
      'Narrative',
    ];
    const rows = sortedReports.map((r) => [
      `"${r.source_record_id}"`,
      `"${r.source_dataset}"`,
      `"${(r.site || r.employer || '').replace(/"/g, '""')}"`,
      `"${(r.activity || '').replace(/"/g, '""')}"`,
      `"${(r.hazard || '').replace(/"/g, '""')}"`,
      `"${(r.barrier_failure || '').replace(/"/g, '""')}"`,
      `"${r.sif_potential || 'UNANALYZED'}"`,
      `"${r.sif_confidence || r.sif_score || 0}"`,
      `"${(r.energy_source || '').replace(/"/g, '""')}"`,
      `"${r.report_text.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sif_guard_intelligence_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* 1. Page Header */}
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
            <h2 className="section-title" style={{ margin: 0 }}>
              Incident & Observation Intelligence Explorer
            </h2>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--success)',
                background: 'rgba(32, 217, 151, 0.10)',
                border: '1px solid rgba(32, 217, 151, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                }}
              />
              SYSTEM LIVE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Browse, filter, and inspect Serious Injury & Fatality (SIF) precursor intelligence across safety reports.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            title={`Last synced: ${lastSyncTime.toLocaleTimeString()}`}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Sync Telemetry</span>
          </button>

          <button onClick={exportFilteredCSV} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button onClick={() => onNavigate('ingestion')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
            + Import New Dataset
          </button>
        </div>
      </div>

      {/* 2. Intelligence Summary KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* KPI 1: Total Records */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: '14px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="micro-label">TOTAL RECORDS</span>
              <div
                className="numeric-display"
                style={{ fontSize: '1.65rem', fontWeight: 700, margin: '6px 0 2px 0' }}
              >
                {stats.total.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ingested safety observations
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Database size={18} />
            </div>
          </div>
        </div>

        {/* KPI 2: SIF Signals */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            borderLeft: '3px solid var(--danger)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="micro-label" style={{ color: 'var(--danger)' }}>SIF SIGNALS</span>
              <div
                className="numeric-display"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  margin: '6px 0 2px 0',
                  color: 'var(--danger)',
                }}
              >
                {stats.sifCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {stats.sifDensity.toFixed(1)}% of total records
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(232, 93, 93, 0.12)',
                border: '1px solid rgba(232, 93, 93, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
              }}
            >
              <ShieldAlert size={18} />
            </div>
          </div>
        </div>

        {/* KPI 3: Uncertain Signals */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            borderLeft: '3px solid var(--warning)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="micro-label" style={{ color: 'var(--warning)' }}>UNCERTAIN SIGNALS</span>
              <div
                className="numeric-display"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  margin: '6px 0 2px 0',
                  color: 'var(--warning)',
                }}
              >
                {stats.uncertainCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Requires safety triage
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 179, 71, 0.12)',
                border: '1px solid rgba(255, 179, 71, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warning)',
              }}
            >
              <HelpCircle size={18} />
            </div>
          </div>
        </div>

        {/* KPI 4: High Priority Precursors */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            borderLeft: '3px solid var(--primary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="micro-label" style={{ color: 'var(--primary)' }}>HIGH PRIORITY</span>
              <div
                className="numeric-display"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  margin: '6px 0 2px 0',
                  color: 'var(--primary-bright)',
                }}
              >
                {stats.highPriorityCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                High confidence or barrier failure
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-primary-bg)',
                border: '1px solid rgba(255, 106, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <AlertCircle size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Investigation Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Top search & Quick View Mode buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Primary Search Bar */}
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search
              size={17}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search narratives, activities, hazards, sites, or record IDs... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 38px',
                borderRadius: '9px',
                border: '1px solid var(--border)',
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                fontFamily: 'var(--font-main)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick View Mode Pills */}
          <div
            style={{
              display: 'flex',
              background: 'var(--background-secondary)',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'ALL' ? 'var(--surface-elevated)' : 'transparent',
                color: viewMode === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'ALL' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setViewMode('PRIORITY')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'PRIORITY' ? 'rgba(255, 106, 0, 0.18)' : 'transparent',
                color: viewMode === 'PRIORITY' ? 'var(--primary-bright)' : 'var(--text-muted)',
                boxShadow: viewMode === 'PRIORITY' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Priority ({stats.highPriorityCount})
            </button>
            <button
              onClick={() => setViewMode('SIF_ONLY')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'SIF_ONLY' ? 'rgba(232, 93, 93, 0.18)' : 'transparent',
                color: viewMode === 'SIF_ONLY' ? 'var(--danger)' : 'var(--text-muted)',
                boxShadow: viewMode === 'SIF_ONLY' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              SIF ({stats.sifCount})
            </button>
            <button
              onClick={() => setViewMode('UNCERTAIN_ONLY')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'UNCERTAIN_ONLY' ? 'rgba(255, 179, 71, 0.18)' : 'transparent',
                color: viewMode === 'UNCERTAIN_ONLY' ? 'var(--warning)' : 'var(--text-muted)',
                boxShadow: viewMode === 'UNCERTAIN_ONLY' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Uncertain ({stats.uncertainCount})
            </button>
          </div>
        </div>

        {/* Bottom Dropdowns Row */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* SIF Classification Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Classification:
            </span>
            <select
              value={sifFilter}
              onChange={(e) => setSifFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Classifications</option>
              <option value="SIF_POTENTIAL">SIF Potential Only</option>
              <option value="NON_SIF">Non-SIF Only</option>
              <option value="UNCERTAIN">Uncertain Only</option>
            </select>
          </div>

          {/* Dataset Source Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Source:
            </span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Sources</option>
              <option value="osha_severe">OSHA Severe Injury</option>
              <option value="osha_construction">OSHA Construction</option>
              <option value="oil_hsse">OIL HSSE Data</option>
            </select>
          </div>

          {/* Facility / Site Filter */}
          {uniqueSites.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Site:
              </span>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  maxWidth: '180px',
                }}
              >
                <option value="ALL">All Sites ({uniqueSites.length})</option>
                {uniqueSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hazard Type Filter */}
          {uniqueHazards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Hazard:
              </span>
              <select
                value={hazardFilter}
                onChange={(e) => setHazardFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  maxWidth: '180px',
                }}
              >
                <option value="ALL">All Hazards ({uniqueHazards.length})</option>
                {uniqueHazards.map((haz) => (
                  <option key={haz} value={haz}>
                    {haz}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="priority">Priority (Risk First)</option>
              <option value="confidence">SIF Confidence</option>
              <option value="site">Facility / Site (A-Z)</option>
              <option value="activity">Activity (A-Z)</option>
              <option value="hazard">Hazard (A-Z)</option>
              <option value="id">Record ID</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '7px' }}
              title={`Sort direction: ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown size={13} />
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
              Active Filters:
            </span>
            {activeFilters.map((f) => (
              <div key={f.key} className="filter-chip">
                <span style={{ color: 'var(--text-muted)' }}>{f.label}:</span>
                <span style={{ color: 'var(--primary-bright)', fontWeight: 600 }}>{f.value}</span>
                <button onClick={f.clear} className="filter-chip-remove" title="Remove filter">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={clearAllFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* 4. Results Header & Count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {sortedReports.length.toLocaleString()} {sortedReports.length === 1 ? 'intelligence record' : 'intelligence records'}
          </span>
          {activeFilters.length > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              (filtered from {stats.total.toLocaleString()})
            </span>
          )}
        </div>

        {/* Showing Range & Page Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Showing {sortedReports.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, sortedReports.length)} of {sortedReports.length}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Reports Table */}
      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : sortedReports.length === 0 ? (
        <EmptyState
          title="No Intelligence Records Found"
          description="No reports match your current filter and search criteria. Try adjusting or clearing your filters."
          actionLabel="Clear Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <div
          className="card"
          style={{
            overflow: 'hidden',
            width: '100%',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '1050px' }}>
              <thead>
                <tr>
                  <th style={{ width: '140px', whiteSpace: 'nowrap' }}>Record ID</th>
                  <th style={{ width: '130px', whiteSpace: 'nowrap' }}>Source</th>
                  <th style={{ minWidth: '160px', maxWidth: '220px' }}>Site / Employer</th>
                  <th style={{ minWidth: '180px', maxWidth: '260px' }}>Activity / Task</th>
                  <th style={{ minWidth: '160px', maxWidth: '220px' }}>Hazard</th>
                  <th style={{ minWidth: '170px', maxWidth: '240px' }}>Barrier Defect</th>
                  <th style={{ width: '160px', whiteSpace: 'nowrap' }}>SIF Classification</th>
                  <th style={{ width: '100px', whiteSpace: 'nowrap', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  const isHighRisk =
                    r.sif_potential === 'SIF_POTENTIAL' &&
                    ((r.sif_confidence || r.sif_score || 0) >= 0.8 || Boolean(r.barrier_failure));

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenReport(r)}
                      style={{
                        height: '52px',
                        background: isSelected
                          ? 'rgba(255, 106, 0, 0.08)'
                          : undefined,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="interactive-row"
                    >
                      {/* Record ID */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isHighRisk && (
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--danger)',
                                flexShrink: 0,
                              }}
                              title="High Priority Risk Precursor"
                            />
                          )}
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              color: 'var(--primary-bright)',
                              fontWeight: 700,
                            }}
                          >
                            #{r.source_record_id}
                          </span>
                        </div>
                      </td>

                      {/* Source Dataset */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.source_dataset}
                        </span>
                      </td>

                      {/* Site / Facility */}
                      <td
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.site || r.employer || 'Unspecified'}
                      >
                        {r.site || r.employer || 'Unspecified'}
                      </td>

                      {/* Activity / Task */}
                      <td
                        style={{
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-primary)',
                          fontSize: '0.84rem',
                        }}
                        title={r.activity || r.report_text}
                      >
                        {r.activity || 'Unspecified'}
                      </td>

                      {/* Hazard */}
                      <td
                        style={{
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-secondary)',
                          fontSize: '0.84rem',
                        }}
                        title={r.hazard || 'Unspecified'}
                      >
                        {r.hazard || 'Unspecified'}
                      </td>

                      {/* Barrier Defect */}
                      <td
                        style={{
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.barrier_failure || 'None Detected'}
                      >
                        {r.barrier_failure ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--danger)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ fontSize: '0.75rem' }}>⚠️</span>
                            {r.barrier_failure}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None Detected</span>
                        )}
                      </td>

                      {/* SIF Classification Badge */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <SIFBadge status={r.sif_potential} score={r.sif_score || r.sif_confidence} showScore />
                      </td>

                      {/* Inspect Action */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReport(r);
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div
            style={{
              padding: '14px 20px',
              background: 'var(--background-secondary)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Page {safeCurrentPage} of {totalPages} ({sortedReports.length} total records)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="btn btn-secondary"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  opacity: safeCurrentPage === 1 ? 0.4 : 1,
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {/* Page Number Chips */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && safeCurrentPage > 3) {
                    pageNum = safeCurrentPage - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  if (pageNum <= 0) pageNum = 1;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: safeCurrentPage === pageNum ? 'var(--primary)' : 'var(--border)',
                        background: safeCurrentPage === pageNum ? 'var(--primary)' : 'var(--surface-elevated)',
                        color: safeCurrentPage === pageNum ? '#FFFFFF' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="btn btn-secondary"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  opacity: safeCurrentPage === totalPages ? 0.4 : 1,
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Intelligence Detail Drawer / Slide-Over Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            className="drawer-backdrop"
            onClick={() => setSelectedReport(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="drawer-content"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'relative',
              }}
            >
              {/* Drawer Top Bar */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--background-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--primary-bright)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      #{selectedReport.source_record_id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: 'var(--surface-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {selectedReport.source_dataset}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    {selectedReport.site || selectedReport.employer || 'Facility Precursor Analysis'}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Stepper Navigation */}
                  <div style={{ display: 'flex', gap: '2px', marginRight: '8px' }}>
                    <button
                      onClick={() => handleNavigateDrawer(-1)}
                      disabled={selectedIndex <= 0}
                      className="btn btn-secondary"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        opacity: selectedIndex <= 0 ? 0.3 : 1,
                      }}
                      title="Previous record in list"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleNavigateDrawer(1)}
                      disabled={selectedIndex >= sortedReports.length - 1}
                      className="btn btn-secondary"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        opacity: selectedIndex >= sortedReports.length - 1 ? 0.3 : 1,
                      }}
                      title="Next record in list"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedReport(null)}
                    className="btn btn-secondary"
                    style={{ padding: '6px', borderRadius: '8px' }}
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Body - Scrollable Content */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                }}
              >
                {/* 1. SIF Classification & Confidence Badge Row */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background:
                      selectedReport.sif_potential === 'SIF_POTENTIAL'
                        ? 'rgba(232, 93, 93, 0.10)'
                        : selectedReport.sif_potential === 'NON_SIF'
                        ? 'rgba(32, 217, 151, 0.10)'
                        : 'rgba(255, 179, 71, 0.10)',
                    border: `1px solid ${
                      selectedReport.sif_potential === 'SIF_POTENTIAL'
                        ? 'rgba(232, 93, 93, 0.3)'
                        : selectedReport.sif_potential === 'NON_SIF'
                        ? 'rgba(32, 217, 151, 0.3)'
                        : 'rgba(255, 179, 71, 0.3)'
                    }`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SIFBadge
                      status={selectedReport.sif_potential}
                      score={selectedReport.sif_score || selectedReport.sif_confidence}
                      showScore
                      size="lg"
                    />
                    {selectedReport.barrier_failure && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(232, 93, 93, 0.2)',
                          color: 'var(--danger)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        BARRIER DEFECT DETECTED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Confidence:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {Math.round(((selectedReport.sif_confidence || selectedReport.sif_score || 0) > 1 ? (selectedReport.sif_confidence || selectedReport.sif_score || 0) : (selectedReport.sif_confidence || selectedReport.sif_score || 0) * 100))}%
                    </strong>
                  </div>
                </div>

                {/* 2. Free-Text Incident Narrative with Evidence Highlighter */}
                <div
                  style={{
                    background: 'var(--surface-elevated)',
                    padding: '18px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} color="var(--primary)" /> Incident Free-Text Narrative (NLP Grounding):
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                    <EvidenceHighlighter
                      text={selectedReport.report_text}
                      energySource={selectedReport.energy_source}
                      barrierFailure={selectedReport.barrier_failure}
                      hazard={selectedReport.hazard}
                    />
                  </div>
                </div>

                {/* 3. Structured Extracted Parameters Grid */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Extracted Precursor Attributes
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    {/* Site */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Facility / Employer
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.site || selectedReport.employer || 'Unspecified'}
                      </span>
                    </div>

                    {/* Activity */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Activity / Task
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.activity || 'Unspecified'}
                      </span>
                    </div>

                    {/* Hazard */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Identified Hazard
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.hazard || 'Unspecified'}
                      </span>
                    </div>

                    {/* Barrier Failure */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Barrier Defect
                      </span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: selectedReport.barrier_failure ? 700 : 500,
                          color: selectedReport.barrier_failure ? 'var(--danger)' : 'var(--text-muted)',
                        }}
                      >
                        {selectedReport.barrier_failure || 'None Detected'}
                      </span>
                    </div>

                    {/* Energy Source */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Energy Source
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.energy_source || 'Unspecified'}
                      </span>
                    </div>

                    {/* Severity / Consequence */}
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '9px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="micro-label" style={{ display: 'block', marginBottom: '4px' }}>
                        Actual Severity / Body Part
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedReport.actual_severity || selectedReport.affected_body_part || 'Observation / Near Miss'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. AI Explanation & NLP Model Assessment */}
                <div>
                  {!selectedReport.sif_potential && !analysisData ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px',
                        background: 'var(--surface-elevated)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        This report has not been evaluated by the NLP SIF classifier.
                      </p>
                      <button
                        onClick={() => handleRunAnalysis(selectedReport.id)}
                        disabled={analyzing}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                      >
                        <Play size={15} /> {analyzing ? 'Running Extraction...' : 'Analyze Report Now'}
                      </button>
                    </div>
                  ) : (
                    <AIExplanationPanel
                      sifResult={analysisData?.sif}
                      sifStatus={selectedReport.sif_potential}
                      sifScore={selectedReport.sif_score || selectedReport.sif_confidence}
                      actualSeverity={selectedReport.actual_severity}
                      extracted={
                        analysisData?.extraction || {
                          activity: selectedReport.activity || null,
                          hazard: selectedReport.hazard || null,
                          barrier_failure: selectedReport.barrier_failure || null,
                          energy_source: selectedReport.energy_source || null,
                        }
                      }
                      lsrMatches={analysisData?.life_saving_rules || selectedReport.life_saving_rules || []}
                    />
                  )}
                </div>

                {/* 5. Historically Similar Incidents (HNSW Semantic Retrieval) */}
                {similarReports.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                      }}
                    >
                      <Layers size={15} color="var(--primary)" /> Similar Historical Precursors (Vector Cosine):
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {similarReports.map((sim, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--primary-bright)',
                                fontSize: '0.75rem',
                              }}
                            >
                              #{sim.source_record_id}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--success)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {Math.round(sim.similarity * 100)}% Match
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              color: 'var(--text-secondary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.4,
                            }}
                          >
                            {sim.report_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Bottom Actions */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--background-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    onNavigate('review');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <span>Open in Review Queue</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
