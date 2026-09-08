import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { FacilityZone, ZoneIncident } from '../../../types/facility';
import { getRiskColor } from '../../../utils/riskUtils';
import { buildRefineryModel, createRefineryMaterials, type LayerVisibility } from './RefineryStructures';
import { createZoneMeshes, type ZoneMeshEntry } from './RefineryRiskZones';
import { createIncidentMarkers, type Incident3DEntry } from './RefineryIncidentMarkers';
import { ZONE_3D_CONFIGS, CAMERA_PRESETS } from './zoneConfig';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Compass,
  AlertTriangle,
  Sliders,
  ChevronDown,
  HelpCircle,
  X,
  MapPin,
} from 'lucide-react';

interface RefineryCanvasProps {
  zones: FacilityZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  hoveredZoneId: string | null;
  onHoverZone: (zoneId: string | null) => void;
  activeIncidents: ZoneIncident[];
  onSelectIncident?: (incident: ZoneIncident) => void;
  theme?: 'light' | 'dark';
  onFallback2D?: () => void;
}

export const RefineryCanvas: React.FC<RefineryCanvasProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  hoveredZoneId,
  onHoverZone,
  activeIncidents,
  onSelectIncident,
  theme = 'dark',
  onFallback2D,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebGL support state
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  // Layer Visibility State
  const [layers, setLayers] = useState<LayerVisibility>({
    riskZones: true,
    incidents: false, // SIF incident pins off by default
    pipelines: true,
    equipment: true,
    labels: true,
  });

  const [activePreset, setActivePreset] = useState<string>('overview');
  const [layersOpen, setLayersOpen] = useState(false);
  const [controlsHelpOpen, setControlsHelpOpen] = useState(false);
  const [hoveredData, setHoveredData] = useState<{
    type: 'zone' | 'incident';
    data: FacilityZone | ZoneIncident;
    x: number;
    y: number;
  } | null>(null);

  // Three.js Core References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const refineryGroupRef = useRef<THREE.Group | null>(null);

  // Lighting References for Dynamic Theme Switching
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const dirLight1Ref = useRef<THREE.DirectionalLight | null>(null);
  const dirLight2Ref = useRef<THREE.DirectionalLight | null>(null);

  // Dynamic mesh refs
  const zoneEntriesRef = useRef<ZoneMeshEntry[]>([]);
  const incidentEntriesRef = useRef<Incident3DEntry[]>([]);
  const flameMeshRef = useRef<THREE.Mesh | null>(null);
  const pipeCollarsRef = useRef<THREE.Mesh[]>([]);
  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]);

  // Camera animation interpolation state
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 68, 68));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 2));
  const isAnimatingCam = useRef<boolean>(false);

  // Smooth Camera Preset Transition
  const triggerCameraTransition = useCallback(
    (position: [number, number, number], target: [number, number, number], presetId: string) => {
      targetCamPos.current.set(...position);
      targetLookAt.current.set(...target);
      isAnimatingCam.current = true;
      setActivePreset(presetId);
    },
    []
  );

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 620;
    const isLight = theme === 'light';

    // 1. Scene
    const scene = new THREE.Scene();
    const bgColor = isLight ? 0xe2e8f0 : 0x0b0806;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.004 : 0.007);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(0, 68, 68);
    camera.lookAt(0, 0, 2);
    cameraRef.current = camera;

    // 3. WebGL Renderer with Error Guard
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isLight ? 1.15 : 1.0;
      rendererRef.current = renderer;
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setWebGlSupported(false);
      return;
    }

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera going below ground
    controls.minDistance = 15;
    controls.maxDistance = 180;
    controls.target.set(0, 0, 2);
    controlsRef.current = controls;

    // 5. Environmental Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.3 : 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xe0f2fe : 0xffaa55,
      isLight ? 0x94a3b8 : 0x110c08,
      isLight ? 0.9 : 0.4
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Primary Sun Directional Light
    const dirLight1 = new THREE.DirectionalLight(isLight ? 0xfffbeb : 0xffeedd, isLight ? 1.8 : 1.4);
    dirLight1.position.set(45, 80, 50);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 10;
    dirLight1.shadow.camera.far = 250;
    dirLight1.shadow.camera.left = -70;
    dirLight1.shadow.camera.right = 70;
    dirLight1.shadow.camera.top = 70;
    dirLight1.shadow.camera.bottom = -70;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    // Secondary Fill Light
    const dirLight2 = new THREE.DirectionalLight(isLight ? 0x93c5fd : 0x446688, isLight ? 0.6 : 0.5);
    dirLight2.position.set(-50, 40, -40);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    // 6. Build Refinery Base Structures
    const materials = createRefineryMaterials(theme);
    const refineryGroup = new THREE.Group();
    refineryGroup.name = 'REFINERY_STRUCTURES';
    scene.add(refineryGroup);
    refineryGroupRef.current = refineryGroup;

    const { flareFlameMesh, pipeFlowCollars } = buildRefineryModel(
      refineryGroup,
      materials,
      layers,
      theme
    );
    flameMeshRef.current = flareFlameMesh;
    pipeCollarsRef.current = pipeFlowCollars;

    // 7. Animation & Render Loop
    let animationFrameId: number;
    const startRenderTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startRenderTime) * 0.001;

      // Camera smooth transition lerp
      if (isAnimatingCam.current) {
        camera.position.lerp(targetCamPos.current, 0.06);
        controls.target.lerp(targetLookAt.current, 0.06);

        if (
          camera.position.distanceTo(targetCamPos.current) < 0.15 &&
          controls.target.distanceTo(targetLookAt.current) < 0.15
        ) {
          isAnimatingCam.current = false;
        }
      }

      controls.update();

      // Animate Flare Flame
      if (flameMeshRef.current) {
        const flicker = 1 + Math.sin(elapsedTime * 15) * 0.15 + Math.cos(elapsedTime * 23) * 0.1;
        flameMeshRef.current.scale.set(flicker, 1 + Math.sin(elapsedTime * 10) * 0.2, flicker);
      }

      // Animate Pipeline Flow Collars
      pipeCollarsRef.current.forEach((collar, idx) => {
        collar.position.x = ((elapsedTime * 12 + idx * 14) % 76) - 38;
      });

      // Animate Zone Pulsing Beacon lights
      zoneEntriesRef.current.forEach((entry) => {
        if (entry.isCritical || entry.isHigh) {
          const intensity = (Math.sin(elapsedTime * 6 + entry.pulsePhase) + 1) * 2;
          entry.beaconLights.forEach((light) => {
            light.intensity = intensity;
          });
        }
      });

      // Animate SIF Incident Diamond Pins & Shockwave Radar Rings
      incidentEntriesRef.current.forEach((entry) => {
        if (entry.pinMesh) {
          entry.pinMesh.rotation.y = elapsedTime * 2;
          entry.pinMesh.position.y =
            (entry.baseY || 3.5) + Math.sin(elapsedTime * 3 + entry.bobOffset) * 0.35;
        }
        entry.radarRings.forEach((ring, rIdx) => {
          const wave = (Math.sin(elapsedTime * 3 + rIdx * 1.2) + 1) / 2;
          ring.scale.set(1 + wave * 0.5, 1, 1 + wave * 0.5);
          if (ring.material instanceof THREE.MeshBasicMaterial) {
            ring.material.opacity = (1 - wave) * 0.6;
          }
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Synchronize Theme Changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const isLight = theme === 'light';
    const bgColor = isLight ? 0xe2e8f0 : 0x0b0806;

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.004 : 0.007);

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isLight ? 1.3 : 0.6;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.setHex(isLight ? 0xe0f2fe : 0xffaa55);
      hemiLightRef.current.groundColor.setHex(isLight ? 0x94a3b8 : 0x110c08);
      hemiLightRef.current.intensity = isLight ? 0.9 : 0.4;
    }
    if (dirLight1Ref.current) {
      dirLight1Ref.current.color.setHex(isLight ? 0xfffbeb : 0xffeedd);
      dirLight1Ref.current.intensity = isLight ? 1.8 : 1.4;
    }
    if (dirLight2Ref.current) {
      dirLight2Ref.current.color.setHex(isLight ? 0x93c5fd : 0x446688);
      dirLight2Ref.current.intensity = isLight ? 0.6 : 0.5;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = isLight ? 1.15 : 1.0;
    }

    // Rebuild structures with updated theme materials
    const oldRefinery = scene.getObjectByName('REFINERY_STRUCTURES');
    if (oldRefinery) scene.remove(oldRefinery);

    const materials = createRefineryMaterials(theme);
    const refineryGroup = new THREE.Group();
    refineryGroup.name = 'REFINERY_STRUCTURES';
    scene.add(refineryGroup);
    refineryGroupRef.current = refineryGroup;

    const { flareFlameMesh, pipeFlowCollars } = buildRefineryModel(
      refineryGroup,
      materials,
      layers,
      theme
    );
    flameMeshRef.current = flareFlameMesh;
    pipeCollarsRef.current = pipeFlowCollars;
  }, [theme, layers]);

  // Update Dynamic Zones & Incidents when data/selection/hover/layer changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean existing zone meshes
    const oldZoneGroup = scene.getObjectByName('ZONE_GROUP');
    if (oldZoneGroup) scene.remove(oldZoneGroup);

    // Clean existing incident meshes
    const oldIncGroup = scene.getObjectByName('INCIDENT_GROUP');
    if (oldIncGroup) scene.remove(oldIncGroup);

    interactiveMeshesRef.current = [];

    // Create & Add Zones
    if (layers.riskZones) {
      const { zoneGroup, entries, interactiveMeshes } = createZoneMeshes(
        zones,
        selectedZoneId,
        hoveredZoneId,
        layers.labels
      );
      zoneGroup.name = 'ZONE_GROUP';
      scene.add(zoneGroup);
      zoneEntriesRef.current = entries;
      interactiveMeshesRef.current.push(...interactiveMeshes);
    } else {
      zoneEntriesRef.current = [];
    }

    // Create & Add Incidents
    if (layers.incidents) {
      const { incidentGroup, entries, interactiveMeshes } = createIncidentMarkers(
        activeIncidents,
        selectedZoneId
      );
      incidentGroup.name = 'INCIDENT_GROUP';
      scene.add(incidentGroup);
      incidentEntriesRef.current = entries;
      interactiveMeshesRef.current.push(...interactiveMeshes);
    } else {
      incidentEntriesRef.current = [];
    }
  }, [zones, selectedZoneId, hoveredZoneId, activeIncidents, layers.riskZones, layers.incidents, layers.labels]);

  // Sync camera when selectedZoneId changes externally
  useEffect(() => {
    if (selectedZoneId) {
      const cfg = ZONE_3D_CONFIGS[selectedZoneId];
      if (cfg) {
        targetCamPos.current.set(...cfg.cameraFocus.position);
        targetLookAt.current.set(...cfg.cameraFocus.target);
        isAnimatingCam.current = true;
        setActivePreset(selectedZoneId);
      }
    }
  }, [selectedZoneId]);

  // Pointer Interaction (Raycasting hover & click)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, false);

    if (intersects.length > 0) {
      const topHit = intersects[0].object;
      const userData = topHit.userData;

      if (userData.type === 'zone') {
        onHoverZone(userData.zoneId);
        setHoveredData({
          type: 'zone',
          data: userData.zone,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else if (userData.type === 'incident') {
        onHoverZone(userData.zoneId);
        setHoveredData({
          type: 'incident',
          data: userData.incident,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    } else {
      if (hoveredData) {
        onHoverZone(null);
        setHoveredData(null);
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, false);

    if (intersects.length > 0) {
      const topHit = intersects[0].object;
      const userData = topHit.userData;

      if (userData.type === 'zone') {
        onSelectZone(userData.zoneId);
      } else if (userData.type === 'incident') {
        onSelectZone(userData.zoneId);
        if (onSelectIncident) {
          onSelectIncident(userData.incident);
        }
      }
    }
  };

  // WebGL Fallback screen
  if (!webGlSupported) {
    return (
      <div
        style={{
          width: '100%',
          height: '620px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '24px',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <AlertTriangle size={36} color="#FF9500" />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            WebGL Acceleration Unavailable
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            Your browser or display hardware is currently unable to initialize hardware-accelerated 3D graphics.
          </p>
        </div>
        {onFallback2D && (
          <button
            onClick={onFallback2D}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--primary)',
              color: '#000000',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MapPin size={16} /> Switch to 2D Spatial Map
          </button>
        )}
      </div>
    );
  }

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '620px',
        minHeight: '620px',
        position: 'relative',
        backgroundColor: isLight ? '#e2e8f0' : '#0c0a08',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0, 0, 0, 0.5)',
        userSelect: 'none',
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
          outline: 'none',
        }}
      />

      {/* Floating Hover Tooltip */}
      {hoveredData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 40,
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(23, 17, 13, 0.95)',
            border: `1px solid ${isLight ? 'var(--border)' : 'rgba(255, 106, 0, 0.5)'}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.15)' : '0 12px 30px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            maxWidth: '280px',
            fontSize: '12px',
            transform: `translate(${Math.min(hoveredData.x + 15, 420)}px, ${Math.min(hoveredData.y + 15, 480)}px)`,
          }}
        >
          {hoveredData.type === 'zone' ? (
            (() => {
              const zone = hoveredData.data as FacilityZone;
              const color = getRiskColor(zone.risk_level);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {zone.code}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        backgroundColor: `${color}25`,
                        color,
                      }}
                    >
                      {zone.risk_level} ({zone.risk_score}/100)
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>{zone.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                    <div>
                      SIF Precursors: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>{zone.critical_incidents}</span>
                    </div>
                    <div>
                      Total Incidents: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>{zone.total_incidents}</span>
                    </div>
                  </div>
                  {zone.dominant_hazard && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Dominant Hazard: <span style={{ color: isLight ? '#d97706' : '#ffd60a' }}>{zone.dominant_hazard}</span>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            (() => {
              const inc = hoveredData.data as ZoneIncident;
              const isSif = inc.sif_potential === 'SIF_POTENTIAL';
              const color = isSif ? '#ff3b30' : getRiskColor(inc.severity);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ff453a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> {inc.id}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        backgroundColor: `${color}25`,
                        color,
                      }}
                    >
                      {inc.severity}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '11px', lineHeight: 1.3, maxHeight: '42px', overflow: 'hidden' }}>
                    {inc.report_summary || inc.report_text}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Zone: <span style={{ color: 'var(--text-primary)' }}>{inc.zone_name}</span>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Top Left: Enterprise Camera Presets Dropdown & Selector */}
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
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
          boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
          maxWidth: 'calc(100% - 170px)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            padding: '0 4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          <Compass size={14} color="var(--primary)" /> Focus:
        </span>
        {CAMERA_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                triggerCameraTransition(preset.position, preset.target, preset.id);
                if (preset.id !== 'overview') {
                  onSelectZone(preset.id);
                }
              }}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#000000' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {preset.label}
            </button>
          );
        })}
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
            <span>3D Layers</span>
            <ChevronDown size={14} style={{ transform: layersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {layersOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: '200px',
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
                Toggle Spatial Overlays
              </div>

              {[
                { key: 'riskZones', label: 'Risk Heat Volumes' },
                { key: 'incidents', label: 'SIF Incidents Pins' },
                { key: 'pipelines', label: 'Pipeline Racks & Flow' },
                { key: 'equipment', label: 'Refinery Equipment' },
                { key: 'labels', label: 'Zone 3D Badges' },
              ].map(({ key, label }) => {
                const isVisible = layers[key as keyof LayerVisibility];
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setLayers((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof LayerVisibility],
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
                    {isVisible ? (
                      <Eye size={14} color="#30d158" />
                    ) : (
                      <EyeOff size={14} color="#8e8e93" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: Professional Compact Interaction Controls Popover */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 30 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setControlsHelpOpen(!controlsHelpOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(23, 17, 13, 0.88)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <HelpCircle size={13} color="var(--primary)" />
              <span>Controls</span>
            </button>

            <button
              onClick={() => triggerCameraTransition([0, 68, 68], [0, 0, 2], 'overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(23, 17, 13, 0.88)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.3)',
              }}
              title="Reset Camera to Overview"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          {controlsHelpOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '36px',
                left: 0,
                width: '230px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(23, 17, 13, 0.98)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>3D Navigation</span>
                <button
                  onClick={() => setControlsHelpOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '6px', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rotate:</span>
                <span>Left click + drag</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pan:</span>
                <span>Right click + drag</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Zoom:</span>
                <span>Scroll wheel</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reset:</span>
                <span>Reset button / Double-click</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: Digital Twin Telemetry Status */}
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
          3D DIGITAL TWIN: <span style={{ color: '#30d158', fontWeight: 700 }}>LIVE</span>
        </span>
      </div>
    </div>
  );
};
