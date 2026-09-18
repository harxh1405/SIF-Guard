import React, { useEffect, useState, useCallback } from 'react';
import type { FacilityRiskSummary, DemoSimulationResponse, ZoneIncident } from '../types/facility';
import { getFacilityOverview, resetDemoData } from '../api/facility';
import { FacilityMetricsHUD } from '../components/facility/FacilityMetricsHUD';
import { FacilitySvg } from '../components/facility/FacilitySvg';
import { RefineryCanvas } from '../components/facility/3d/RefineryCanvas';
import { ZoneStatusList } from '../components/facility/ZoneStatusList';
import { LiveActivityTimeline } from '../components/facility/LiveActivityTimeline';
import { FloatingZoneInspector } from '../components/facility/FloatingZoneInspector';
import { DemoSimulationModal } from '../components/facility/DemoSimulationModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import {
  Zap,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
  Box,
  Map as MapIcon,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FacilityTwinPageProps {
  theme?: 'dark' | 'light';
}

export const FacilityTwinPage: React.FC<FacilityTwinPageProps> = ({ theme = 'dark' }) => {
  const [summary, setSummary] = useState<FacilityRiskSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'zones' | 'timeline'>('zones');
  const [simulationToast, setSimulationToast] = useState<{ title: string; zone: string } | null>(null);

  // Layout toggles
  const [isImmersionMode, setIsImmersionMode] = useState<boolean>(false);
  const [isDeckCollapsed, setIsDeckCollapsed] = useState<boolean>(false);
  const [canvasResetSignal, setCanvasResetSignal] = useState<number>(0);

  const isLight = theme === 'light';

  const fetchOverview = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getFacilityOverview();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load facility digital twin telemetry');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getFacilityOverview()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Failed to load facility digital twin telemetry');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetDemo = async () => {
    setIsResetting(true);
    setSelectedZoneId(null);
    setHoveredZoneId(null);
    setCanvasResetSignal((prev) => prev + 1);
    try {
      const data = await resetDemoData();
      setSummary(data);
      setSimulationToast(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reset demo simulation data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSimulationSuccess = (res: DemoSimulationResponse) => {
    setSummary(res.updated_facility_summary);
    setSelectedZoneId(res.affected_zone_id);
    setSimulationToast({
      title: res.incident.report_summary || 'New Simulated Precursor',
      zone: res.affected_zone_name,
    });
    setTimeout(() => {
      setSimulationToast(null);
    }, 7000);
  };

  const handleSelectIncident = (incident: ZoneIncident) => {
    setSelectedZoneId(incident.zone_id);
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h2 className="section-title">Refinery Digital Twin & Dynamic SIF Risk Matrix</h2>
          <p className="section-subtitle">Initializing 3D WebGL refinery twin and real-time operational telemetry...</p>
        </div>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div>
        <ErrorBanner message={error || 'No facility telemetry available'} onRetry={() => fetchOverview(true)} />
      </div>
    );
  }

  const selectedZone = summary.zones.find((z) => z.id === selectedZoneId) || null;
  const allActiveIncidents = summary.zones.flatMap((z) => z.incidents || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2
              className="section-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              Refinery Digital Twin // Spatial SIF Surveillance
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '5px',
                backgroundColor: viewMode === '3d' ? 'rgba(255, 115, 0, 0.15)' : 'rgba(32, 217, 151, 0.15)',
                color: viewMode === '3d' ? 'var(--primary, #FF7300)' : 'var(--success, #20D997)',
                border: `1px solid ${viewMode === '3d' ? 'rgba(255, 115, 0, 0.3)' : 'rgba(32, 217, 151, 0.3)'}`,
                letterSpacing: '0.05em',
              }}
            >
              <Sparkles size={11} /> {viewMode === '3d' ? '3D WEBGL ACTIVE' : '2D MAP ACTIVE'}
            </div>
          </div>
          <p
            className="section-subtitle"
            style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            Real-time deterministic barrier degradation modeling, precursor flare propagation, and equipment telemetry.
          </p>
        </div>

        {/* Action Controls & Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 3D / 2D Switch */}
          <div
            style={{
              display: 'flex',
              backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              padding: '2px',
              border: `1px solid ${isLight ? '#cbd5e1' : 'var(--border)'}`,
            }}
          >
            <button
              onClick={() => setViewMode('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === '3d'
                  ? (isLight ? '#003366' : '#FF7300')
                  : 'transparent',
                color: viewMode === '3d'
                  ? '#FFFFFF'
                  : (isLight ? '#334155' : 'var(--text-secondary)'),
                fontWeight: viewMode === '3d' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: viewMode === '3d'
                  ? (isLight ? '0 1px 4px rgba(0, 51, 102, 0.25)' : '0 2px 8px rgba(255, 115, 0, 0.35)')
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Box size={13} color={viewMode === '3d' ? '#FFFFFF' : 'currentColor'} /> 3D Twin
            </button>
            <button
              onClick={() => setViewMode('2d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === '2d'
                  ? (isLight ? '#003366' : '#FF7300')
                  : 'transparent',
                color: viewMode === '2d'
                  ? '#FFFFFF'
                  : (isLight ? '#334155' : 'var(--text-secondary)'),
                fontWeight: viewMode === '2d' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: viewMode === '2d'
                  ? (isLight ? '0 1px 4px rgba(0, 51, 102, 0.25)' : '0 2px 8px rgba(255, 115, 0, 0.35)')
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <MapIcon size={13} color={viewMode === '2d' ? '#FFFFFF' : 'currentColor'} /> 2D Map
            </button>
          </div>

          {/* Simulate Incident Flare */}
          <button
            onClick={() => setIsDemoModalOpen(true)}
            style={{
              padding: '6px 13px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF7300 0%, #E65100 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(255, 115, 0, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={13} /> Simulate Flare
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            style={{
              padding: '6px 11px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#ffffff' : 'var(--surface-elevated)',
              border: `1px solid ${isLight ? '#cbd5e1' : 'var(--border)'}`,
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: isResetting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Reset active simulated demo incidents"
          >
            <RotateCcw size={13} /> Reset
          </button>

          {/* Refresh Telemetry */}
          <button
            onClick={() => fetchOverview(false)}
            style={{
              padding: '6px 11px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#ffffff' : 'var(--surface-elevated)',
              border: `1px solid ${isLight ? '#cbd5e1' : 'var(--border)'}`,
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Refresh facility telemetry"
          >
            <RefreshCw size={13} /> Refresh
          </button>

          {/* Full Immersion Mode Toggle */}
          <button
            onClick={() => {
              setIsImmersionMode(!isImmersionMode);
            }}
            style={{
              padding: '6px 11px',
              borderRadius: '8px',
              backgroundColor: isImmersionMode
                ? 'rgba(255, 115, 0, 0.2)'
                : (isLight ? '#ffffff' : 'var(--surface-elevated)'),
              border: `1px solid ${isImmersionMode ? 'var(--primary)' : (isLight ? '#cbd5e1' : 'var(--border)')}`,
              color: isImmersionMode ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title={isImmersionMode ? 'Exit Immersion Mode (Show Sidebars & HUD)' : 'Enter Immersion Mode (Expand 3D Full-Width)'}
          >
            {isImmersionMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isImmersionMode ? 'Exit Immersion' : 'Immersion'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry Ribbon (Sits cleanly ABOVE the canvas, NOT floating inside the 3D scene!) */}
      {!isImmersionMode && (
        <div style={{ width: '100%', position: 'relative', zIndex: 60 }}>
          <FacilityMetricsHUD
            summary={summary}
            variant="floating-ribbon"
            theme={theme}
          />
        </div>
      )}

      {/* 3. Main Stage: Side-by-Side Flex Container with 3D Canvas + Docked Right Panel */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
          height: isImmersionMode
            ? 'clamp(640px, calc(100vh - 190px), 880px)'
            : 'clamp(580px, calc(100vh - 250px), 820px)',
          position: 'relative',
          transition: 'height 0.2s ease',
        }}
      >
        {/* Left Column: 3D Stage (Takes available space, 100% unobstructed!) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            position: 'relative',
            borderRadius: '14px',
            overflow: 'hidden',
            backgroundColor: isLight ? '#e2e8f0' : '#070b12',
            border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.9)' : 'rgba(255, 255, 255, 0.12)'}`,
            boxShadow: isLight
              ? '0 8px 24px rgba(0, 51, 102, 0.08)'
              : '0 16px 48px rgba(0, 0, 0, 0.6)',
          }}
        >
          {viewMode === '3d' ? (
            <RefineryCanvas
              zones={summary.zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
              hoveredZoneId={hoveredZoneId}
              onHoverZone={(zoneId) => setHoveredZoneId(zoneId)}
              activeIncidents={allActiveIncidents}
              onSelectIncident={handleSelectIncident}
              theme={theme}
              onFallback2D={() => setViewMode('2d')}
              height="100%"
              resetSignal={canvasResetSignal}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', padding: '20px' }}>
              <FacilitySvg
                zones={summary.zones}
                selectedZoneId={selectedZoneId}
                onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
                hoveredZoneId={hoveredZoneId}
                onHoverZone={(zoneId) => setHoveredZoneId(zoneId)}
                activeIncidents={allActiveIncidents}
                onSelectIncident={handleSelectIncident}
                theme={theme}
              />
            </div>
          )}

          {/* Simulation Live Flare Toast Alert (Centered Top) */}
          <AnimatePresence>
            {simulationToast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 59, 48, 0.95)',
                  backdropFilter: 'blur(16px)',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(255, 59, 48, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <ShieldAlert size={15} />
                <span style={{ fontWeight: 800 }}>FLARE ESCALATED: {simulationToast.zone}</span>
                <span style={{ opacity: 0.85, fontSize: '11px' }}>{simulationToast.title}</span>
                <button
                  onClick={() => setSimulationToast(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Inspector ONLY if in Immersion Mode (so user can inspect on 3D click while in immersion) */}
          {isImmersionMode && selectedZone && (
            <FloatingZoneInspector
              zone={selectedZone}
              onClose={() => setSelectedZoneId(null)}
              onSimulateInZone={(_zId) => setIsDemoModalOpen(true)}
              theme={theme}
              isDocked={false}
            />
          )}
        </div>

        {/* Right Column: Docked Zone Deck (SIDE-BY-SIDE with 3D canvas, NOT covering 3D!) */}
        {!isImmersionMode && (
          <div
            style={{
              width: isDeckCollapsed ? '38px' : '330px',
              flexShrink: 0,
              height: '100%',
              transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {isDeckCollapsed ? (
              /* Slim vertical strip to expand the deck */
              <button
                onClick={() => setIsDeckCollapsed(false)}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${isLight ? '#cbd5e1' : 'var(--border)'}`,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  transition: 'all 0.15s ease',
                }}
                title="Expand Zone List & Telemetry"
              >
                <ChevronLeft size={16} color="var(--primary)" />
                <span
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Zone Matrix
                </span>
              </button>
            ) : (
              /* Full Docked Card */
              <div
                style={{
                  height: '100%',
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 18, 30, 0.92)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderRadius: '14px',
                  border: `1px solid ${isLight ? 'rgba(203, 213, 225, 0.85)' : 'rgba(255, 255, 255, 0.12)'}`,
                  boxShadow: isLight
                    ? '0 12px 28px rgba(0, 51, 102, 0.08)'
                    : '0 16px 40px rgba(0, 0, 0, 0.55)',
                  padding: selectedZone ? '0' : '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: selectedZone ? '0' : '10px',
                  overflow: 'hidden',
                }}
              >
                {selectedZone ? (
                  /* When a zone is selected, render the Zone Inspector cleanly inside the dock! */
                  <FloatingZoneInspector
                    zone={selectedZone}
                    onClose={() => setSelectedZoneId(null)}
                    onSimulateInZone={(_zId) => setIsDemoModalOpen(true)}
                    theme={theme}
                    isDocked={true}
                  />
                ) : (
                  /* When no zone is selected, render the Zone List or Telemetry Feed */
                  <>
                    {/* Header & Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          backgroundColor: isLight ? '#f1f5f9' : 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '2px',
                          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
                        }}
                      >
                        <button
                          onClick={() => setActiveTab('zones')}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'zones'
                              ? (isLight ? '#ffffff' : 'var(--surface-elevated)')
                              : 'transparent',
                            color: activeTab === 'zones' ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'zones' ? 700 : 500,
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Zones ({summary.zones.length})
                        </button>
                        <button
                          onClick={() => setActiveTab('timeline')}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'timeline'
                              ? (isLight ? '#ffffff' : 'var(--surface-elevated)')
                              : 'transparent',
                            color: activeTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === 'timeline' ? 700 : 500,
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Feed ({summary.recent_timeline.length})
                        </button>
                      </div>

                      {/* Collapse Button */}
                      <button
                        onClick={() => setIsDeckCollapsed(true)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Collapse Sidebar"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                      {activeTab === 'zones' ? (
                        <ZoneStatusList
                          zones={summary.zones}
                          selectedZoneId={selectedZoneId}
                          onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
                          onHoverZone={(zoneId) => setHoveredZoneId(zoneId)}
                          theme={theme}
                        />
                      ) : (
                        <LiveActivityTimeline
                          timeline={summary.recent_timeline}
                          onSelectZone={(zoneId) => {
                            setSelectedZoneId(zoneId);
                            setActiveTab('zones');
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Demo Simulation Launcher Modal */}
      <DemoSimulationModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSimulated={handleSimulationSuccess}
      />
    </div>
  );
};
