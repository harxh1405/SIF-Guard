import * as THREE from 'three';
import type { ZoneIncident } from '../../../types/facility';
import { getRiskHexNumber } from '../../../utils/riskUtils';
import { ZONE_3D_CONFIGS } from './zoneConfig';

export interface Incident3DEntry {
  incident: ZoneIncident;
  markerGroup: THREE.Group;
  pinMesh: THREE.Mesh;
  radarRings: THREE.Mesh[];
  baseY: number;
  bobOffset: number;
  isSif: boolean;
}

export function createIncidentMarkers(
  incidents: ZoneIncident[],
  _selectedZoneId: string | null
): {
  incidentGroup: THREE.Group;
  entries: Incident3DEntry[];
  interactiveMeshes: THREE.Mesh[];
} {
  const incidentGroup = new THREE.Group();
  const entries: Incident3DEntry[] = [];
  const interactiveMeshes: THREE.Mesh[] = [];

  // Group incidents by zone to space them nicely in 3D
  const zoneCounts: Record<string, number> = {};

  incidents.forEach((inc) => {
    const config = ZONE_3D_CONFIGS[inc.zone_id];
    if (!config) return;

    const count = zoneCounts[inc.zone_id] || 0;
    zoneCounts[inc.zone_id] = count + 1;

    // Distribute markers in a circle or offset around zone center
    const [cx, , cz] = config.center;
    const angle = (count * 1.8) % (Math.PI * 2);
    const radius = 3.5 + (count % 3) * 2.2;
    const px = cx + Math.cos(angle) * radius;
    const pz = cz + Math.sin(angle) * radius;
    const baseY = 3.5 + (count % 2) * 1.5;

    const markerGroup = new THREE.Group();
    markerGroup.position.set(px, baseY, pz);

    const isSif = inc.sif_potential === 'SIF_POTENTIAL' || inc.severity === 'CRITICAL';
    const colorHex = isSif ? 0xff3b30 : getRiskHexNumber(inc.severity);

    // Pin Geometry: Octahedron (Diamond Beacon)
    const pinGeo = new THREE.OctahedronGeometry(0.85, 0);
    const pinMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.userData = { type: 'incident', incident: inc, zoneId: inc.zone_id };
    markerGroup.add(pinMesh);
    interactiveMeshes.push(pinMesh);

    // Stem connecting pin to ground
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, baseY, 6);
    const stemMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.5,
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.y = -baseY / 2;
    markerGroup.add(stemMesh);

    // Ground Target Circle
    const targetGeo = new THREE.RingGeometry(0.5, 0.8, 16);
    const targetMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.rotation.x = -Math.PI / 2;
    targetMesh.position.y = -baseY + 0.05;
    markerGroup.add(targetMesh);

    // Animated Radar Rings for SIF Incidents
    const radarRings: THREE.Mesh[] = [];
    if (isSif) {
      const ringGeo = new THREE.RingGeometry(0.8, 1.0, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -baseY + 0.06;
      markerGroup.add(ringMesh);
      radarRings.push(ringMesh);
    }

    incidentGroup.add(markerGroup);

    entries.push({
      incident: inc,
      markerGroup,
      pinMesh,
      radarRings,
      baseY,
      bobOffset: Math.random() * Math.PI * 2,
      isSif,
    });
  });

  return { incidentGroup, entries, interactiveMeshes };
}
