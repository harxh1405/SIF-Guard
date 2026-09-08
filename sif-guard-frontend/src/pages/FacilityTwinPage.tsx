import React, { useEffect, useState, useCallback } from 'react';
import type { FacilityRiskSummary, DemoSimulationResponse, ZoneIncident } from '../types/facility';
import { getFacilityOverview, resetDemoData } from '../api/facility';
import { FacilityMetricsHUD } from '../components/facility/FacilityMetricsHUD';
import { FacilitySvg } from '../components/facility/FacilitySvg';
import { RefineryCanvas } from '../components/facility/3d/RefineryCanvas';
import { ZoneStatusList } from '../components/facility/ZoneStatusList';
import { LiveActivityTimeline } from '../components/facility/LiveActivityTimeline';
import { ZoneDetailDrawer } from '../components/facility/ZoneDetailDrawer';
import { DemoSimulationModal } from '../components/facility/DemoSimulationModal';
import { RiskLegend } from '../components/facility/RiskLegend';
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
    // Clear toast after 6 seconds
    setTimeout(() => {
      setSimulationToast(null);
    }, 6000);
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

  // Flatten active incidents across all zones
  const allActiveIncidents = summary.zones.flatMap((z) => z.incidents || []);

  return (
    <div>
      {/* Page Header & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Refinery Digital Twin & Dynamic SIF Matrix
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: viewMode === '3d' ? 'rgba(255, 106, 0, 0.15)' : 'rgba(32, 217, 151, 0.15)',
                color: viewMode === '3d' ? 'var(--primary)' : 'var(--success)',
                border: `1px solid ${viewMode === '3d' ? 'rgba(255, 106, 0, 0.3)' : 'rgba(32, 217, 151, 0.3)'}`,
                letterSpacing: '0.8px',
              }}
            >
              <Sparkles size={11} /> {viewMode === '3d' ? '3D WEBGL TWIN ACTIVE' : '2D SCHEMATIC ACTIVE'}
            </div>
          </div>
          <p className="section-subtitle" style={{ marginTop: '4px' }}>
            Photorealistic 3D spatial refinery twin with deterministic SIF risk propagation, active barrier tracking, and one-click incident simulation.
          </p>
        </div>

        {/* Action Controls & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* 3D / 2D View Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === '3d' ? 'var(--primary)' : 'transparent',
                color: viewMode === '3d' ? '#000' : 'var(--text-secondary)',
                fontWeight: viewMode === '3d' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Box size={14} /> 3D Twin
            </button>
            <button
              onClick={() => setViewMode('2d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === '2d' ? 'var(--surface-elevated)' : 'transparent',
                color: viewMode === '2d' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: viewMode === '2d' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <MapIcon size={14} /> 2D Map
            </button>
          </div>

          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="action-btn"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(255, 106, 0, 0.35)',
            }}
          >
            <Zap size={14} /> Simulate Incident Flare
          </button>

          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="action-btn"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Clear active simulated demo incidents"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={() => fetchOverview(false)}
            className="action-btn"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Refresh facility telemetry"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Simulation Live Toast Alert */}
      <AnimatePresence>
        {simulationToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginBottom: '16px',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(255, 59, 48, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="#FF3B30" />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF3B30' }}>
                  Simulated Flare Escalated: {simulationToast.zone}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', marginLeft: '8px' }}>
                  {simulationToast.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSimulationToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Level Executive HUD Metrics */}
      <FacilityMetricsHUD summary={summary} activeZoneCount={summary.zones.length} />

      {/* Main Viewport Grid: 3D Twin / 2D Map on Left, Zone Intelligence on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(340px, 1.15fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left: 3D Digital Twin Viewport OR 2D Vector Schematic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            />
          ) : (
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
          )}

          <RiskLegend />
        </div>

        {/* Right: Tabbed Zone Rankings & Real-Time Event Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tabs Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setActiveTab('zones')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'zones' ? 'var(--surface-elevated)' : 'transparent',
                color: activeTab === 'zones' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'zones' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Zone SIF Rankings ({summary.zones.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'timeline' ? 'var(--surface-elevated)' : 'transparent',
                color: activeTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'timeline' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Live Telemetry Feed ({summary.recent_timeline.length})
            </button>
          </div>

          {activeTab === 'zones' ? (
            <ZoneStatusList
              zones={summary.zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={(zoneId) => setSelectedZoneId(zoneId)}
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
      </div>

      {/* Slide-over Deep Inspection Drawer for Selected Zone */}
      <ZoneDetailDrawer
        zone={selectedZone}
        onClose={() => setSelectedZoneId(null)}
      />

      {/* Demo Simulation Launcher Modal */}
      <DemoSimulationModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSimulated={handleSimulationSuccess}
      />
    </div>
  );
};
