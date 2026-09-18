import * as THREE from 'three';
import type { FacilityZone } from '../../../types/facility';
import { getRiskColor, getRiskHexNumber } from '../../../utils/riskUtils';
import { ZONE_3D_CONFIGS } from './zoneConfig';

export interface ZoneMeshEntry {
  zoneId: string;
  padMesh: THREE.Mesh;
  outlineLine: THREE.LineSegments;
  beaconLights: THREE.PointLight[];
  beaconMeshes: THREE.Mesh[];
  labelSprite?: THREE.Sprite;
  baseColorHex: number;
  isCritical: boolean;
  isHigh: boolean;
  pulsePhase: number;
}

export function createZoneSprite(
  code: string,
  name: string,
  riskScore: number,
  riskLevel: string,
  color: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark translucent background card with rounded corners
    ctx.fillStyle = 'rgba(15, 11, 8, 0.90)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 124, 20);
    ctx.fill();
    ctx.stroke();

    // Risk indicator circle dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(42, 70, 16, 0, Math.PI * 2);
    ctx.fill();

    // Zone Code & Title
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${code} · ${name.length > 18 ? name.substring(0, 18) + '…' : name}`, 75, 58);

    // Score & Level Badge
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = color;
    ctx.fillText(`SIF RISK: ${riskScore}/100 [${riskLevel}]`, 75, 102);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(14, 3.8, 1);
  return sprite;
}

export function createZoneMeshes(
  zones: FacilityZone[],
  selectedZoneId: string | null,
  hoveredZoneId: string | null,
  showLabels: boolean = true
): {
  zoneGroup: THREE.Group;
  entries: ZoneMeshEntry[];
  interactiveMeshes: THREE.Mesh[];
} {
  const zoneGroup = new THREE.Group();
  const entries: ZoneMeshEntry[] = [];
  const interactiveMeshes: THREE.Mesh[] = [];

  zones.forEach((zone) => {
    const config = ZONE_3D_CONFIGS[zone.id];
    if (!config) return;

    const [cx, cy, cz] = config.center;
    const [w, , d] = config.size;

    const isSelected = selectedZoneId === zone.id;
    const isHovered = hoveredZoneId === zone.id;
    const isCritical = zone.risk_level === 'CRITICAL' || zone.risk_score >= 80;
    const isHigh = zone.risk_level === 'HIGH' || zone.risk_score >= 60;

    const colorHex = getRiskHexNumber(zone.risk_level);
    const colorStr = getRiskColor(zone.risk_level);

    // Zone Ground Pad (Translucent colored area)
    const padGeo = new THREE.BoxGeometry(w, 0.2, d);
    const padMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      transparent: true,
      opacity: isSelected ? 0.38 : isHovered ? 0.28 : 0.16,
      roughness: 0.5,
      metalness: 0.3,
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: isSelected ? 0.5 : isHovered ? 0.35 : isCritical ? 0.3 : 0.08,
    });

    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(cx, cy + 0.1, cz);
    padMesh.userData = { type: 'zone', zoneId: zone.id, zone };
    zoneGroup.add(padMesh);
    interactiveMeshes.push(padMesh);

    // Zone Perimeter Outline Line
    const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2));
    const outlineMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0xffffff : colorHex,
      linewidth: isSelected ? 2 : 1,
    });
    const outlineLine = new THREE.LineSegments(edgesGeo, outlineMat);
    outlineLine.position.set(cx, cy + 0.18, cz);
    zoneGroup.add(outlineLine);

    // Corner Status Beacons (4 small corner posts with colored status lights)
    const beaconLights: THREE.PointLight[] = [];
    const beaconMeshes: THREE.Mesh[] = [];
    const hw = w / 2 - 0.4;
    const hd = d / 2 - 0.4;

    const cornerOffsets = [
      [-hw, -hd],
      [hw, -hd],
      [-hw, hd],
      [hw, hd],
    ];

    const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x1f1915,
      roughness: 0.5,
      metalness: 0.5,
    });
    const beaconLensMat = new THREE.MeshBasicMaterial({
      color: colorHex,
    });

    cornerOffsets.forEach(([ox, oz]) => {
      const post = new THREE.Mesh(beaconGeo, beaconMat);
      post.position.set(cx + ox, 0.6, cz + oz);
      zoneGroup.add(post);

      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        beaconLensMat
      );
      lens.position.set(cx + ox, 1.25, cz + oz);
      zoneGroup.add(lens);
      beaconMeshes.push(lens);

      if (isCritical || isHigh || isSelected) {
        const pLight = new THREE.PointLight(colorHex, isCritical ? 1.0 : 0.5, 8);
        pLight.position.set(cx + ox, 1.4, cz + oz);
        zoneGroup.add(pLight);
        beaconLights.push(pLight);
      }
    });

    // 3D Billboarding Text Sprite Label
    let labelSprite: THREE.Sprite | undefined;
    if (showLabels) {
      labelSprite = createZoneSprite(
        config.code,
        zone.name,
        zone.risk_score,
        zone.risk_level,
        colorStr
      );
      labelSprite.position.set(...config.labelPos);
      zoneGroup.add(labelSprite);
    }

    entries.push({
      zoneId: zone.id,
      padMesh,
      outlineLine,
      beaconLights,
      beaconMeshes,
      labelSprite,
      baseColorHex: colorHex,
      isCritical,
      isHigh,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  });

  return { zoneGroup, entries, interactiveMeshes };
}
