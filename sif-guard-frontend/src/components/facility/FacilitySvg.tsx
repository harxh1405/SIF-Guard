import React, { useState } from 'react';
import type { FacilityZone, ZoneIncident } from '../../types/facility';
import { getRiskColor } from '../../utils/riskUtils';
import refineryMapImage from '../../assets/refinery-digital-twin.png';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Sliders,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

interface FacilitySvgProps {
  zones: FacilityZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  hoveredZoneId?: string | null;
  onHoverZone?: (zoneId: string | null) => void;
  activeIncidents?: ZoneIncident[];
  onSelectIncident?: (incident: ZoneIncident) => void;
  theme?: 'light' | 'dark';
}

interface ZoneCoordDef {
  polygon: string;
  center: [number, number];
  incidentPin: [number, number];
}

// Coordinate definitions mapped to refinery-digital-twin.png (1672 x 941 resolution)
const ZONE_BASE_COORDS: Record<string, ZoneCoordDef> = {
  'wellhead-area': {
    polygon: '140,160 380,150 430,370 200,410 120,310',
    center: [270, 275],
    incidentPin: [280, 260],
  },
  'pump-station': {
    polygon: '430,210 720,190 760,450 490,490 420,370',
    center: [590, 340],
    incidentPin: [600, 330],
  },
  'tank-farm': {
    polygon: '990,130 1520,120 1590,430 1060,460 970,290',
    center: [1280, 290],
    incidentPin: [1290, 280],
  },
  'pipeline-corridor': {
    polygon: '640,410 1150,380 1240,540 730,570',
    center: [940, 480],
    incidentPin: [940, 470],
  },
  'control-room': {
    polygon: '730,570 1050,550 1090,730 770,760',
    center: [910, 660],
    incidentPin: [910, 650],
  },
  'maintenance-area': {
    polygon: '150,490 530,470 570,790 210,830',
    center: [360, 650],
    incidentPin: [360, 640],
  },
  'loading-area': {
    polygon: '1090,520 1590,500 1630,810 1130,850',
    center: [1360, 675],
    incidentPin: [1360, 665],
  },
};

// Aliases mapping code (Z-01, etc.) and IDs
const ZONE_MAP_COORDS: Record<string, ZoneCoordDef> = {
  ...ZONE_BASE_COORDS,
  'Z-01': ZONE_BASE_COORDS['wellhead-area'],
  'Z-02': ZONE_BASE_COORDS['pump-station'],
  'Z-03': ZONE_BASE_COORDS['tank-farm'],
  'Z-04': ZONE_BASE_COORDS['pipeline-corridor'],
  'Z-05': ZONE_BASE_COORDS['control-room'],
  'Z-06': ZONE_BASE_COORDS['maintenance-area'],
  'Z-07': ZONE_BASE_COORDS['loading-area'],
};

export const FacilitySvg: React.FC<FacilitySvgProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  hoveredZoneId: externalHoveredZoneId,
  onHoverZone,
  activeIncidents = [],
  onSelectIncident,
  theme = 'dark',
}) => {
  const [internalHoveredZoneId, setInternalHoveredZoneId] = useState<string | null>(null);
  const [hoveredIncident, setHoveredIncident] = useState<ZoneIncident | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [layersOpen, setLayersOpen] = useState(false);

  // Layer Visibility
  const [layers, setLayers] = useState({
    heatmap: false,
    incidentPins: false,
    zoneLabels: true,
    boundaries: false,
  });

  const isLight = theme === 'light';
  const effectiveHoveredZoneId = externalHoveredZoneId ?? internalHoveredZoneId;

  const handleZoneMouseEnter = (zoneId: string) => {
    setInternalHoveredZoneId(zoneId);
    if (onHoverZone) onHoverZone(zoneId);
  };

  const handleZoneMouseLeave = () => {
    setInternalHoveredZoneId(null);
    if (onHoverZone) onHoverZone(null);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '620px',
        minHeight: '620px',
        backgroundColor: isLight ? '#e2e8f0' : '#0c0a08',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0, 0, 0, 0.5)',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
    >
      {/* SVG Interactive Canvas */}
      <svg
        viewBox="0 0 1672 941"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          {/* Glowing Filters for Risk Polygons */}
          <filter id="svg-glow-critical" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="svg-glow-high" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Holographic Radar Grid Pattern */}
          <pattern id="twinGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255, 106, 0, 0.08)'}
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* 1. Underlying Realistic Digital Twin Aerial Imagery Layer */}
        <image
          href={refineryMapImage}
          x="0"
          y="0"
          width="1672"
          height="941"
          preserveAspectRatio="xMidYMid slice"
          style={{
            filter: isLight
              ? 'brightness(1.02) contrast(1.04) saturate(1.1)'
              : 'brightness(0.70) contrast(1.18) saturate(0.95)',
          }}
        />

        {/* 2. Cybernetic Spatial Grid Overlay */}
        <rect x="0" y="0" width="1672" height="941" fill="url(#twinGrid)" pointerEvents="none" />

        {/* 3. Interactive Zone Spatial Polygons & Boundary Overlays */}
        {zones.map((zone) => {
          const coords = ZONE_MAP_COORDS[zone.id] || ZONE_MAP_COORDS[zone.code];
          if (!coords) return null;

          const isSelected = selectedZoneId === zone.id || selectedZoneId === zone.code;
          const isHovered = effectiveHoveredZoneId === zone.id || effectiveHoveredZoneId === zone.code;
          const riskColor = getRiskColor(zone.risk_level);
          const isCritical = zone.risk_level === 'CRITICAL';
          const isHigh = zone.risk_level === 'HIGH';

          let fillOpacity = 0.14;
          if (isSelected) fillOpacity = 0.42;
          else if (isHovered) fillOpacity = 0.30;
          else if (isCritical) fillOpacity = 0.25;
          else if (isHigh) fillOpacity = 0.20;

          let strokeOpacity = 0.65;
          let strokeWidth = 2.5;
          if (isSelected) {
            strokeOpacity = 1;
            strokeWidth = 4.5;
          } else if (isHovered) {
            strokeOpacity = 0.95;
            strokeWidth = 3.5;
          }

          return (
            <g key={zone.id} id={`svg-zone-${zone.id}`}>
              {/* Zone Risk Heat Polygon */}
              {(layers.heatmap || isSelected || isHovered) && (
                <polygon
                  points={coords.polygon}
                  fill={riskColor}
                  fillOpacity={fillOpacity}
                  stroke={layers.boundaries || isSelected || isHovered ? riskColor : 'none'}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray={isSelected ? 'none' : '10 5'}
                  filter={isCritical ? 'url(#svg-glow-critical)' : isHigh ? 'url(#svg-glow-high)' : undefined}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => onSelectZone(zone.id)}
                  onMouseEnter={() => handleZoneMouseEnter(zone.id)}
                  onMouseLeave={handleZoneMouseLeave}
                />
              )}

              {/* Pulsing Critical Boundary Ring */}
              {isCritical && (layers.boundaries || isSelected) && (
                <polygon
                  points={coords.polygon}
                  fill="none"
                  stroke="#FF3B30"
                  strokeWidth="3.5"
                  className="pulse-polygon"
                  pointerEvents="none"
                />
              )}

              {/* Zone Center Label Pill */}
              {layers.zoneLabels && (
                <g
                  transform={`translate(${coords.center[0]}, ${coords.center[1]})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectZone(zone.id)}
                  onMouseEnter={() => handleZoneMouseEnter(zone.id)}
                  onMouseLeave={handleZoneMouseLeave}
                >
                  {/* Badge Background Pill */}
                  <rect
                    x="-90"
                    y="-24"
                    width="180"
                    height="48"
                    rx="10"
                    fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 14, 11, 0.95)'}
                    stroke={isSelected ? '#FF6A00' : isHovered ? riskColor : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    filter={isLight ? 'drop-shadow(0px 3px 10px rgba(0,0,0,0.15))' : 'drop-shadow(0px 4px 16px rgba(0,0,0,0.75))'}
                  />

                  {/* Left Color Severity Accent Bar */}
                  <rect x="-90" y="-24" width="7" height="48" rx="3" fill={riskColor} />

                  {/* Zone Code & Risk Score */}
                  <text
                    x="-72"
                    y="-5"
                    fill={isLight ? '#0f172a' : '#f8fafc'}
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {zone.code}
                  </text>

                  <text
                    x="75"
                    y="-5"
                    fill={riskColor}
                    fontSize="12"
                    fontWeight="800"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {zone.risk_score}/100
                  </text>

                  {/* Zone Full Name */}
                  <text
                    x="-72"
                    y="14"
                    fill={isLight ? '#475569' : '#cbd5e1'}
                    fontSize="11"
                    fontWeight="600"
                  >
                    {zone.name.length > 20 ? zone.name.slice(0, 18) + '…' : zone.name}
                  </text>

                  {/* Precursor Incident Count Badge */}
                  {zone.critical_incidents > 0 && (
                    <g transform="translate(74, -22)">
                      <circle r="10" fill="#FF3B30" />
                      <text
                        x="0"
                        y="3.5"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="900"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {zone.critical_incidents}
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 4. Active SIF Incident Precursor Pins */}
        {layers.incidentPins &&
          activeIncidents.map((incident, idx) => {
            const zoneCoord = ZONE_MAP_COORDS[incident.zone_id];
            if (!zoneCoord) return null;

            // Offset slightly if multiple incidents in same zone
            const pinX = zoneCoord.incidentPin[0] + (idx % 2 === 0 ? 30 : -30);
            const pinY = zoneCoord.incidentPin[1] + (idx % 3 === 0 ? -25 : 25);
            const isSif = incident.sif_potential === 'SIF_POTENTIAL';

            return (
              <g
                key={incident.id}
                transform={`translate(${pinX}, ${pinY})`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectZone(incident.zone_id);
                  if (onSelectIncident) onSelectIncident(incident);
                }}
                onMouseEnter={() => setHoveredIncident(incident)}
                onMouseLeave={() => setHoveredIncident(null)}
              >
                {/* Shockwave Animated Radar Ring */}
                <circle
                  r="18"
                  fill="none"
                  stroke={isSif ? '#FF3B30' : '#FF9500'}
                  strokeWidth="2.5"
                  className="pulse-ring"
                />

                {/* Pin Diamond Glyph */}
                <polygon
                  points="0,-16 12,0 0,16 -12,0"
                  fill={isSif ? '#FF3B30' : '#FF9500'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 8px rgba(0,0,0,0.8))"
                />

                {/* Exclamation Icon Inside Pin */}
                <text
                  x="0"
                  y="4.5"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  !
                </text>
              </g>
            );
          })}
      </svg>

      {/* Floating Hover Tooltip for Incident Pin */}
      {hoveredIncident && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 40,
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(23, 17, 13, 0.95)',
            border: '1px solid #FF3B30',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            maxWidth: '300px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#FF3B30', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={13} /> {hoveredIncident.id}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 59, 48, 0.2)',
                color: '#FF3B30',
              }}
            >
              {hoveredIncident.severity}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {hoveredIncident.report_summary || hoveredIncident.report_text}
          </p>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Zone: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{hoveredIncident.zone_name}</span>
          </div>
        </div>
      )}

      {/* Top Left: Zoom & Pan Floating Controls */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(23, 17, 13, 0.92)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleResetZoom}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            gap: '4px',
            fontFamily: 'monospace',
          }}
          title="Reset Zoom & Pan"
        >
          <RotateCcw size={13} /> {Math.round(zoomLevel * 100)}%
        </button>
      </div>

      {/* Top Right: Layer Visibility Filters Dropdown */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 30 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(23, 17, 13, 0.92)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Sliders size={14} color="var(--primary)" />
            <span>Map Layers</span>
            <ChevronDown
              size={14}
              style={{ transform: layersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
            />
          </button>

          {layersOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: '190px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(23, 17, 13, 0.98)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                padding: '10px',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '0 4px 6px 4px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                2D Spatial Overlays
              </div>

              {[
                { key: 'heatmap', label: 'Risk Heat Polygons' },
                { key: 'incidentPins', label: 'SIF Precursor Pins' },
                { key: 'zoneLabels', label: 'Zone Badges & Scores' },
                { key: 'boundaries', label: 'Zone Boundaries' },
              ].map(({ key, label }) => {
                const isVisible = layers[key as keyof typeof layers];
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setLayers((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof layers],
                      }))
                    }
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{label}</span>
                    {isVisible ? <Eye size={14} color="#30d158" /> : <EyeOff size={14} color="#8e8e93" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: Status Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(23, 17, 13, 0.85)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
          fontSize: '10px',
          fontFamily: 'monospace',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#30d158',
            display: 'inline-block',
            boxShadow: '0 0 8px #30d158',
          }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>
          2D SPATIAL TWIN: <span style={{ color: '#30d158', fontWeight: 700 }}>LIVE</span>
        </span>
      </div>

      {/* Pulsing CSS Keyframe Animations */}
      <style>{`
        @keyframes pulse-ring-anim {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-ring {
          transform-origin: center;
          animation: pulse-ring-anim 2.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-poly-anim {
          0% { opacity: 0.8; stroke-width: 3.5px; }
          50% { opacity: 0.3; stroke-width: 6.5px; }
          100% { opacity: 0.8; stroke-width: 3.5px; }
        }
        .pulse-polygon {
          animation: pulse-poly-anim 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
