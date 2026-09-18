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


// Utility to recursively dispose Three.js meshes and materials
const disposeHierarchy = (obj: THREE.Object3D) => {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
};

interface RefineryCanvasProps {
  zones: FacilityZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  hoveredZoneId: string | null;
  onHoverZone: (zoneId: string | null) => void;
  activeIncidents: ZoneIncident[];
  onSelectIncident?: (incident: ZoneIncident) => void;
  theme?: 'light' | 'dark';
  onFallback2D?: () => void;
  minimalOverlay?: boolean;
  customCameraPos?: [number, number, number];
  customCameraTarget?: [number, number, number];
  height?: string | number;
  containerStyle?: React.CSSProperties;
  transparentBg?: boolean;
  resetSignal?: number;
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
  minimalOverlay = false,
  customCameraPos,
  customCameraTarget,
  height,
  containerStyle,
  transparentBg = false,
  resetSignal,
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
    labels: !minimalOverlay,
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const selectedZoneIdRef = useRef<string | null>(selectedZoneId);
  const hoveredZoneIdRef = useRef<string | null>(hoveredZoneId);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerPosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const rafHoverIdRef = useRef<number | null>(null);

  // Camera animation interpolation state
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 68, 68));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 2));
  const isAnimatingCam = useRef<boolean>(false);

  // Stored Initial Framing for Reset View
  const initialCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 90, 100));
  const initialTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4, 0));

  // Reset View Handler (Smooth, controlled return ONLY when explicitly clicked)
  const handleResetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    targetCamPos.current.copy(initialCamPosRef.current);
    targetLookAt.current.copy(initialTargetRef.current);
    isAnimatingCam.current = true;
    setActivePreset('overview');
    onSelectZone(null);
  }, [onSelectZone]);

  // Respond to programmatic external reset triggers
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      handleResetView();
    }
  }, [resetSignal, handleResetView]);

  // Smooth Camera Preset Transition (For full dashboard mode)
  const triggerCameraTransition = useCallback(
    (position: [number, number, number], target: [number, number, number], presetId: string) => {
      targetCamPos.current.set(...position);
      targetLookAt.current.set(...target);
      isAnimatingCam.current = true;
      setActivePreset(presetId);
    },
    []
  );

  // Initialize Three.js Scene (Runs ONCE on mount)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 620;
    const isLight = theme === 'light';
    const isTransparent = minimalOverlay || transparentBg;

    // 1. Scene
    const scene = new THREE.Scene();
    const bgColor = isLight ? 0xe2e8f0 : 0x0b0806;
    if (isTransparent) {
      scene.background = null;
    } else {
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.003 : 0.0025);
    }
    sceneRef.current = scene;

    // 2. WebGL Renderer with Error Guard
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      if (isTransparent) {
        renderer.setClearColor(0x000000, 0);
      }
      renderer.setSize(containerWidth, containerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isLight ? 1.15 : 1.32;
      rendererRef.current = renderer;
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setWebGlSupported(false);
      return;
    }

    // 3. Environmental 5-Point Industrial Lighting Setup
    // Subtle ambient base
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.2 : 0.75);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Sky/Ground gradient illumination
    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xe0f2fe : 0xf5ede4,
      isLight ? 0x94a3b8 : 0x241a14,
      isLight ? 0.9 : 0.7
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Key Light (Sun / Elevated Main)
    const dirKeyLight = new THREE.DirectionalLight(isLight ? 0xfffbeb : 0xfffaf0, isLight ? 1.6 : 1.4);
    dirKeyLight.position.set(65, 85, 55);
    dirKeyLight.castShadow = true;
    dirKeyLight.shadow.mapSize.width = 2048;
    dirKeyLight.shadow.mapSize.height = 2048;
    dirKeyLight.shadow.camera.near = 10;
    dirKeyLight.shadow.camera.far = 300;
    dirKeyLight.shadow.camera.left = -80;
    dirKeyLight.shadow.camera.right = 80;
    dirKeyLight.shadow.camera.top = 80;
    dirKeyLight.shadow.camera.bottom = -80;
    dirKeyLight.shadow.bias = -0.0005;
    scene.add(dirKeyLight);
    dirLight1Ref.current = dirKeyLight;

    // Cool Slate Fill Light (Front-Left)
    const dirFillLight = new THREE.DirectionalLight(isLight ? 0x93c5fd : 0xa0c0e0, isLight ? 0.7 : 0.85);
    dirFillLight.position.set(-55, 45, 45);
    scene.add(dirFillLight);
    dirLight2Ref.current = dirFillLight;

    // Warm Industrial Sodium Rim Light (Back-Right silhouette)
    const dirRimLight = new THREE.DirectionalLight(0xff8822, isLight ? 0.4 : 0.85);
    dirRimLight.position.set(-45, 60, -65);
    scene.add(dirRimLight);

    // Rear Fill Light (Back-Left — keeps geometry readable from all angles)
    const dirBackFill = new THREE.DirectionalLight(0xd0d8e2, isLight ? 0.3 : 0.55);
    dirBackFill.position.set(50, 40, -50);
    scene.add(dirBackFill);

    // 4. Build Refinery Base Structures
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

    // 5. Dynamic Auto-Framing using Facility Equipment Footprint (Radius 44, Center [2, 4.0, 0])
    const facilityCenter = new THREE.Vector3(2, 4.0, 0);
    const facilityRadius = 44; // True industrial equipment footprint

    const aspect = containerWidth / containerHeight;
    const fov = 42;
    const fovRad = (fov * Math.PI) / 180;
    const distV = facilityRadius / Math.tan(fovRad / 2);
    const fovH = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
    const distH = facilityRadius / Math.tan(fovH / 2);

    // Responsive camera distance:
    // On widescreen (aspect >= 1.3), vertical coverage frames tightly at ~98-104 units.
    // On narrower screens (tablet/mobile), blend with distH so facility stays large without horizontal clipping.
    const fitDistance =
      aspect >= 1.3
        ? distV * 0.90
        : Math.max(distV * 0.90, distH * 0.92);

    // Classic 3/4 isometric perspective: 26° elevation, 40° azimuth
    const elevation = 26 * (Math.PI / 180);
    const azimuth = 40 * (Math.PI / 180);

    const calculatedCamPos = new THREE.Vector3(
      facilityCenter.x + fitDistance * Math.cos(elevation) * Math.sin(azimuth),
      facilityCenter.y + fitDistance * Math.sin(elevation),
      facilityCenter.z + fitDistance * Math.cos(elevation) * Math.cos(azimuth)
    );

    const initialPos = customCameraPos ? new THREE.Vector3(...customCameraPos) : calculatedCamPos;
    const initialTarget = customCameraTarget ? new THREE.Vector3(...customCameraTarget) : facilityCenter;

    // 6. Camera Setup
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.5, 1000);
    camera.position.copy(initialPos);
    camera.lookAt(initialTarget);
    cameraRef.current = camera;
    targetCamPos.current.copy(initialPos);
    targetLookAt.current.copy(initialTarget);
    initialCamPosRef.current.copy(initialPos);
    initialTargetRef.current.copy(initialTarget);

    // 7. Orbit Controls Setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initialTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.9;
    controls.minDistance = 25;
    controls.maxDistance = 240;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera dipping below ground
    controls.autoRotate = false; // NO auto-rotation fighting user!
    controls.enableZoom = true; // Smooth mouse wheel / scroll zoom enabled
    controls.zoomSpeed = 0.85;
    controls.enablePan = false;
    renderer.domElement.style.touchAction = 'none';
    controls.update();

    // Any user interaction (drag, touch) cancels programmatic camera lerping
    controls.addEventListener('start', () => {
      isAnimatingCam.current = false;
      isDraggingRef.current = true;
      setHoveredData(null);
    });

    controls.addEventListener('end', () => {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    });

    controlsRef.current = controls;

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const startRenderTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startRenderTime) * 0.001;

      // Programmatic Camera Lerp (Used ONLY during Reset View or preset selection)
      if (isAnimatingCam.current) {
        camera.position.lerp(targetCamPos.current, 0.08);
        controls.target.lerp(targetLookAt.current, 0.08);

        if (
          camera.position.distanceTo(targetCamPos.current) < 0.2 &&
          controls.target.distanceTo(targetLookAt.current) < 0.2
        ) {
          camera.position.copy(targetCamPos.current);
          controls.target.copy(targetLookAt.current);
          isAnimatingCam.current = false;
        }
      }

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


      controls.update();
      renderer.render(scene, camera);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !animationFrameId) {
        animate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animate();

    // 9. Handle Window & Container Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      if (rafHoverIdRef.current !== null) {
        cancelAnimationFrame(rafHoverIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (sceneRef.current) {
        disposeHierarchy(sceneRef.current);
      }
    };
  }, []);

  // Synchronize Theme Changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const isLight = theme === 'light';
    const bgColor = isLight ? 0xe2e8f0 : 0x0b0806;
    const isTransparent = minimalOverlay || transparentBg;

    if (isTransparent) {
      scene.background = null;
      scene.fog = null;
    } else {
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.004 : 0.007);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isLight ? 1.15 : 0.75;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.setHex(isLight ? 0xe0f2fe : 0xffaa55);
      hemiLightRef.current.groundColor.setHex(isLight ? 0x94a3b8 : 0x110c08);
      hemiLightRef.current.intensity = isLight ? 0.85 : 0.7;
    }
    if (dirLight1Ref.current) {
      dirLight1Ref.current.color.setHex(isLight ? 0xfffbeb : 0xffeedd);
      dirLight1Ref.current.intensity = isLight ? 1.6 : 1.4;
    }
    if (dirLight2Ref.current) {
      dirLight2Ref.current.color.setHex(isLight ? 0x93c5fd : 0x446688);
      dirLight2Ref.current.intensity = isLight ? 0.7 : 0.5;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = isLight ? 1.2 : 1.32;
    }

    // Rebuild structures with updated theme materials
    const oldRefinery = scene.getObjectByName('REFINERY_STRUCTURES');
    if (oldRefinery) {
      scene.remove(oldRefinery);
      disposeHierarchy(oldRefinery);
    }

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

  // Fast in-place zone highlighting without destroying/recreating 3D meshes
  const updateZoneHighlight = useCallback((targetHoveredId: string | null, targetSelectedId: string | null) => {
    zoneEntriesRef.current.forEach((entry) => {
      const isSelected = targetSelectedId === entry.zoneId;
      const isHovered = targetHoveredId === entry.zoneId;
      const mat = entry.padMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = isSelected ? 0.38 : isHovered ? 0.30 : 0.16;
        mat.emissiveIntensity = isSelected ? 0.5 : isHovered ? 0.38 : entry.isCritical ? 0.3 : 0.08;
      }
      const lineMat = entry.outlineLine.material as THREE.LineBasicMaterial;
      if (lineMat) {
        lineMat.color.setHex(isSelected || isHovered ? 0xffffff : entry.baseColorHex);
      }
    });
  }, []);

  // Update Dynamic Zones & Incidents ONLY when data, layers or structure changes (NOT on hover)
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
        selectedZoneIdRef.current,
        hoveredZoneIdRef.current,
        layers.labels && !minimalOverlay
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
        selectedZoneIdRef.current
      );
      incidentGroup.name = 'INCIDENT_GROUP';
      scene.add(incidentGroup);
      incidentEntriesRef.current = entries;
      interactiveMeshesRef.current.push(...interactiveMeshes);
    } else {
      incidentEntriesRef.current = [];
    }
  }, [zones, activeIncidents, layers.riskZones, layers.incidents, layers.labels, minimalOverlay]);

  // Synchronize selection / hover highlighting without rebuilding meshes
  useEffect(() => {
    selectedZoneIdRef.current = selectedZoneId;
    hoveredZoneIdRef.current = hoveredZoneId;
    updateZoneHighlight(hoveredZoneId, selectedZoneId);
  }, [hoveredZoneId, selectedZoneId, updateZoneHighlight]);

  // Sync camera when selectedZoneId changes externally (Only in full dashboard mode)
  useEffect(() => {
    if (selectedZoneId && !minimalOverlay) {
      const cfg = ZONE_3D_CONFIGS[selectedZoneId];
      if (cfg) {
        targetCamPos.current.set(...cfg.cameraFocus.position);
        targetLookAt.current.set(...cfg.cameraFocus.target);
        isAnimatingCam.current = true;
        setActivePreset(selectedZoneId);
      }
    }
  }, [selectedZoneId, minimalOverlay]);

  // Process raycasting hover via requestAnimationFrame
  const processHover = useCallback(() => {
    rafHoverIdRef.current = null;
    if (isDraggingRef.current) return;
    if (!pointerPosRef.current) return;

    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = pointerPosRef.current;
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    const intersects = raycasterRef.current.intersectObjects(interactiveMeshesRef.current, false);

    if (intersects.length > 0) {
      const topHit = intersects[0].object;
      const userData = topHit.userData;
      const hitZoneId = (userData.zoneId as string) || null;

      const posX = clientX - rect.left;
      const posY = clientY - rect.top;

      // Update tooltip position immediately on DOM element without React re-render
      if (tooltipRef.current) {
        const maxX = Math.max(100, rect.width - 295);
        const maxY = Math.max(100, rect.height - 180);
        tooltipRef.current.style.transform = `translate(${Math.min(Math.max(10, posX + 16), maxX)}px, ${Math.min(Math.max(10, posY + 16), maxY)}px)`;
      }

      // Only update state & notify parent when the hovered zone actually changes
      if (hitZoneId !== hoveredZoneIdRef.current) {
        hoveredZoneIdRef.current = hitZoneId;
        onHoverZone(hitZoneId);
        updateZoneHighlight(hitZoneId, selectedZoneIdRef.current);

        if (userData.type === 'zone') {
          setHoveredData({
            type: 'zone',
            data: userData.zone,
            x: posX,
            y: posY,
          });
        } else if (userData.type === 'incident') {
          setHoveredData({
            type: 'incident',
            data: userData.incident,
            x: posX,
            y: posY,
          });
        }
      }
    } else {
      if (hoveredZoneIdRef.current !== null) {
        hoveredZoneIdRef.current = null;
        onHoverZone(null);
        setHoveredData(null);
        updateZoneHighlight(null, selectedZoneIdRef.current);
      }
    }
  }, [onHoverZone, updateZoneHighlight]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    isAnimatingCam.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If mouse button is held and moved > 4px, user is in active OrbitControls drag
    if (e.buttons > 0) {
      const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
      if (dist > 4) {
        isDraggingRef.current = true;
        if (hoveredData) {
          setHoveredData(null);
        }
        return;
      }
    }

    pointerPosRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (rafHoverIdRef.current === null) {
      rafHoverIdRef.current = requestAnimationFrame(processHover);
    }
  };

  const handleCanvasClick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    const intersects = raycasterRef.current.intersectObjects(interactiveMeshesRef.current, false);

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

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
    if (dist <= 4 && !isDraggingRef.current) {
      handleCanvasClick(e.clientX, e.clientY);
    }
    setTimeout(() => {
      isDraggingRef.current = false;
      pointerPosRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafHoverIdRef.current === null) {
        rafHoverIdRef.current = requestAnimationFrame(processHover);
      }
    }, 50);
  };

  const handlePointerLeave = () => {
    if (rafHoverIdRef.current !== null) {
      cancelAnimationFrame(rafHoverIdRef.current);
      rafHoverIdRef.current = null;
    }
    pointerPosRef.current = null;
    if (hoveredZoneIdRef.current !== null) {
      hoveredZoneIdRef.current = null;
      onHoverZone(null);
      setHoveredData(null);
      updateZoneHighlight(null, selectedZoneIdRef.current);
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
        height: height || (minimalOverlay ? '100%' : '620px'),
        minHeight: height ? '100%' : (minimalOverlay ? 'unset' : '620px'),
        position: 'relative',
        backgroundColor: (minimalOverlay || transparentBg)
          ? 'transparent'
          : (isLight ? '#e2e8f0' : '#0c0a08'),
        borderRadius: minimalOverlay ? '0' : '12px',
        overflow: minimalOverlay ? 'visible' : 'hidden',
        border: minimalOverlay ? 'none' : '1px solid var(--border)',
        boxShadow: minimalOverlay
          ? 'none'
          : (isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0, 0, 0, 0.5)'),
        userSelect: 'none',
        ...containerStyle,
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleResetView}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
          outline: 'none',
          touchAction: 'none',
        }}
      />

      {/* Floating Hover Tooltip */}
      {hoveredData && (
        <div
          ref={tooltipRef}
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
            transform: `translate(${Math.min(hoveredData.x + 16, 800)}px, ${Math.min(hoveredData.y + 16, 600)}px)`,
            transition: 'transform 0.04s ease-out',
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

      {/* Overlays and HUD controls */}
      {!minimalOverlay && (
        <>
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
              onClick={handleResetView}
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
        </>
      )}

      {minimalOverlay && (
        <>
          {/* Top Bar: Telemetry Badge & Subtle Reset View Button */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            {/* Left Title Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.70)' : 'rgba(14, 11, 9, 0.45)',
                border: isLight ? '1px solid rgba(195, 182, 168, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FF7300',
                  boxShadow: '0 0 8px #FF7300',
                }}
              />
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: isLight ? '#1C1815' : '#E8E1D9',
                  letterSpacing: '0.04em',
                }}
              >
                OIL REFINERY DIGITAL TWIN · 3D
              </span>
            </div>

            {/* Center Helper Label */}
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.55)' : 'rgba(14, 11, 9, 0.40)',
                border: isLight ? '1px solid rgba(195, 182, 168, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: isLight ? '#554B41' : 'rgba(255, 255, 255, 0.50)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                DRAG TO ORBIT
              </span>
            </div>

            {/* Right Reset View Button */}
            <button
              onClick={handleResetView}
              title="Reset camera to initial full-facility view"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(14, 11, 9, 0.45)',
                border: isLight ? '1px solid rgba(195, 182, 168, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                color: isLight ? '#554B41' : '#A8A099',
                fontSize: '0.70rem',
                fontWeight: 600,
                fontFamily: 'monospace',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: 'none',
                transition: 'all 0.15s ease',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isLight ? '#1C1815' : '#F5F1EA';
                e.currentTarget.style.borderColor = '#FF7300';
                e.currentTarget.style.backgroundColor = isLight ? '#FFFFFF' : 'rgba(255, 115, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isLight ? '#554B41' : '#A8A099';
                e.currentTarget.style.borderColor = isLight ? 'rgba(195, 182, 168, 0.4)' : 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(14, 11, 9, 0.45)';
              }}
            >
              <RotateCcw size={12} />
              <span>RESET VIEW</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
