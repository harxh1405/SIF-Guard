import * as THREE from 'three';

export interface LayerVisibility {
  riskZones: boolean;
  incidents: boolean;
  pipelines: boolean;
  equipment: boolean;
  labels: boolean;
}

export interface RefineryMaterials {
  ground: THREE.MeshStandardMaterial;
  road: THREE.MeshStandardMaterial;
  roadLine: THREE.MeshBasicMaterial;
  concrete: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  steelLight: THREE.MeshStandardMaterial;
  tankWhite: THREE.MeshStandardMaterial;
  tankDome: THREE.MeshStandardMaterial;
  pipeOrange: THREE.MeshStandardMaterial;
  pipeYellow: THREE.MeshStandardMaterial;
  pipeBlue: THREE.MeshStandardMaterial;
  pipeSilver: THREE.MeshStandardMaterial;
  pipeGlow: THREE.MeshBasicMaterial;
  buildingWall: THREE.MeshStandardMaterial;
  buildingGlass: THREE.MeshStandardMaterial;
  buildingRoof: THREE.MeshStandardMaterial;
  hazardStripe: THREE.MeshBasicMaterial;
  flareGlow: THREE.MeshBasicMaterial;
  truckBody: THREE.MeshStandardMaterial;
  truckCab: THREE.MeshStandardMaterial;
}

export function createRefineryMaterials(theme: 'light' | 'dark' = 'dark'): RefineryMaterials {
  const isLight = theme === 'light';

  return {
    ground: new THREE.MeshStandardMaterial({
      color: isLight ? 0xc2cad4 : 0x120d09,
      roughness: isLight ? 0.9 : 0.85,
      metalness: isLight ? 0.05 : 0.15,
    }),
    road: new THREE.MeshStandardMaterial({
      color: isLight ? 0x334155 : 0x1a130e,
      roughness: 0.75,
      metalness: isLight ? 0.15 : 0.25,
    }),
    roadLine: new THREE.MeshBasicMaterial({
      color: isLight ? 0xf59e0b : 0xffaa00,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: isLight ? 0xd1d8e0 : 0x2e231b,
      roughness: 0.8,
      metalness: isLight ? 0.1 : 0.2,
    }),
    steelDark: new THREE.MeshStandardMaterial({
      color: isLight ? 0x526070 : 0x3d4752,
      roughness: 0.45,
      metalness: 0.75,
    }),
    steelLight: new THREE.MeshStandardMaterial({
      color: isLight ? 0x8b99a8 : 0x8a99a8,
      roughness: 0.35,
      metalness: 0.85,
    }),
    tankWhite: new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0xecf2f7,
      roughness: 0.3,
      metalness: isLight ? 0.35 : 0.4,
    }),
    tankDome: new THREE.MeshStandardMaterial({
      color: isLight ? 0xb0c0d0 : 0xc8d6e3,
      roughness: 0.3,
      metalness: 0.5,
    }),
    pipeOrange: new THREE.MeshStandardMaterial({
      color: isLight ? 0xe05600 : 0xff6a00,
      roughness: 0.35,
      metalness: 0.65,
    }),
    pipeYellow: new THREE.MeshStandardMaterial({
      color: isLight ? 0xd97706 : 0xffcc00,
      roughness: 0.35,
      metalness: 0.65,
    }),
    pipeBlue: new THREE.MeshStandardMaterial({
      color: isLight ? 0x0284c7 : 0x0099ff,
      roughness: 0.35,
      metalness: 0.65,
    }),
    pipeSilver: new THREE.MeshStandardMaterial({
      color: isLight ? 0x94a3b8 : 0xa8b8c8,
      roughness: 0.25,
      metalness: 0.9,
    }),
    pipeGlow: new THREE.MeshBasicMaterial({
      color: isLight ? 0xe05600 : 0xffaa33,
    }),
    buildingWall: new THREE.MeshStandardMaterial({
      color: isLight ? 0xcbd5e1 : 0x241c16,
      roughness: 0.6,
      metalness: isLight ? 0.15 : 0.3,
    }),
    buildingGlass: new THREE.MeshStandardMaterial({
      color: isLight ? 0x38bdf8 : 0x38536e,
      roughness: 0.1,
      metalness: 0.9,
    }),
    buildingRoof: new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : 0x17110c,
      roughness: 0.8,
      metalness: 0.2,
    }),
    hazardStripe: new THREE.MeshBasicMaterial({
      color: isLight ? 0xe05600 : 0xff9900,
    }),
    flareGlow: new THREE.MeshBasicMaterial({
      color: isLight ? 0xff4500 : 0xff4d00,
    }),
    truckBody: new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : 0x4a3c32,
      roughness: 0.5,
      metalness: 0.5,
    }),
    truckCab: new THREE.MeshStandardMaterial({
      color: isLight ? 0xe05600 : 0xff6a00,
      roughness: 0.35,
      metalness: 0.6,
    }),
  };
}

export function buildRefineryModel(
  scene: THREE.Group,
  mats: RefineryMaterials,
  layers: LayerVisibility,
  theme: 'light' | 'dark' = 'dark'
): { flareFlameMesh: THREE.Mesh; pipeFlowCollars: THREE.Mesh[] } {
  const pipeFlowCollars: THREE.Mesh[] = [];
  const isLight = theme === 'light';

  // =========================================================================
  // 1. GROUND, PERIMETER & INDUSTRIAL GRID
  // =========================================================================
  const groundGeo = new THREE.PlaneGeometry(130, 110);
  const groundMesh = new THREE.Mesh(groundGeo, mats.ground);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.05;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // High-Tech Industrial Spatial Grid
  const gridHelper = new THREE.GridHelper(
    120,
    30,
    isLight ? 0x0284c7 : 0xff6a00,
    isLight ? 0x94a3b8 : 0x2a1e16
  );
  gridHelper.position.y = 0.01;
  const gridMat = gridHelper.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = isLight ? 0.35 : 0.45;
  scene.add(gridHelper);

  // Perimeter Boundary Line
  const fenceGeo = new THREE.BoxGeometry(116, 0.5, 96);
  const fenceEdges = new THREE.EdgesGeometry(fenceGeo);
  const fenceLine = new THREE.LineSegments(
    fenceEdges,
    new THREE.LineBasicMaterial({ color: isLight ? 0x64748b : 0x5a4436 })
  );
  fenceLine.position.y = 0.25;
  scene.add(fenceLine);

  // Roads Network
  // Central Main Arterial Road
  const roadHoriz = new THREE.Mesh(new THREE.PlaneGeometry(114, 7), mats.road);
  roadHoriz.rotation.x = -Math.PI / 2;
  roadHoriz.position.set(0, 0.02, 14);
  scene.add(roadHoriz);

  // Central Road Yellow Centerline
  const cLine = new THREE.Mesh(new THREE.PlaneGeometry(112, 0.3), mats.roadLine);
  cLine.rotation.x = -Math.PI / 2;
  cLine.position.set(0, 0.03, 14);
  scene.add(cLine);

  // Vertical Connecting Roads
  [-18, 18].forEach((rx) => {
    const roadVert = new THREE.Mesh(new THREE.PlaneGeometry(6, 94), mats.road);
    roadVert.rotation.x = -Math.PI / 2;
    roadVert.position.set(rx, 0.02, 0);
    scene.add(roadVert);
  });

  // =========================================================================
  // 2. TANK FARM (Z-03)
  // =========================================================================
  const tankFarmGroup = new THREE.Group();
  tankFarmGroup.position.set(35, 0, -25);

  // Concrete Containment Dike Wall
  const dikeWallGeo = new THREE.BoxGeometry(30, 1.4, 24);
  const dikeEdges = new THREE.EdgesGeometry(dikeWallGeo);
  const dikeLine = new THREE.LineSegments(
    dikeEdges,
    new THREE.LineBasicMaterial({ color: isLight ? 0xe05600 : 0xff8800 })
  );
  dikeLine.position.y = 0.7;
  tankFarmGroup.add(dikeLine);

  const dikeFloor = new THREE.Mesh(new THREE.BoxGeometry(29, 0.2, 23), mats.concrete);
  dikeFloor.position.y = 0.1;
  tankFarmGroup.add(dikeFloor);

  // Cylindrical Tanks
  const createTank = (x: number, z: number, radius: number, height: number) => {
    const tankGroup = new THREE.Group();
    tankGroup.position.set(x, 0, z);

    // Body
    const cylGeo = new THREE.CylinderGeometry(radius, radius, height, 28);
    const cylMesh = new THREE.Mesh(cylGeo, mats.tankWhite);
    cylMesh.position.y = height / 2;
    cylMesh.castShadow = true;
    tankGroup.add(cylMesh);

    // Domed Roof
    const domeGeo = new THREE.SphereGeometry(radius, 28, 14, 0, Math.PI * 2, 0, Math.PI / 3);
    const domeMesh = new THREE.Mesh(domeGeo, mats.tankDome);
    domeMesh.position.y = height;
    domeMesh.rotation.x = Math.PI;
    domeMesh.scale.set(1, 0.35, 1);
    tankGroup.add(domeMesh);

    // Spiral Catwalk Rings
    [0.4, 0.75].forEach((ratio) => {
      const ringGeo = new THREE.TorusGeometry(radius + 0.12, 0.09, 8, 28);
      const ringMesh = new THREE.Mesh(ringGeo, mats.steelDark);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = height * ratio;
      tankGroup.add(ringMesh);
    });

    // Top Pressure Relief Vent & Foam Monitor
    const ventGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8);
    const ventMesh = new THREE.Mesh(ventGeo, mats.steelDark);
    ventMesh.position.y = height + 0.7;
    tankGroup.add(ventMesh);

    return tankGroup;
  };

  // TK-101 Large Crude Tank
  tankFarmGroup.add(createTank(-6, 2, 5.5, 8.0));
  // TK-102 Slop Tank
  tankFarmGroup.add(createTank(6, -4, 4.2, 6.5));
  // TK-104 Condensate Storage
  tankFarmGroup.add(createTank(7, 5, 4.0, 6.0));

  if (layers.equipment) scene.add(tankFarmGroup);

  // =========================================================================
  // 3. PROCESS FRACTIONATION COLUMNS & DISTILLATION UNIT
  // =========================================================================
  const processGroup = new THREE.Group();
  processGroup.position.set(-6, 0, -8);

  // Main Distillation Fractionation Column (Tall)
  const towerGeo = new THREE.CylinderGeometry(2.0, 2.0, 19, 28);
  const towerMesh = new THREE.Mesh(towerGeo, mats.steelLight);
  towerMesh.position.y = 9.5;
  towerMesh.castShadow = true;
  processGroup.add(towerMesh);

  // Top Dome
  const colDome = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 12), mats.steelLight);
  colDome.position.y = 19;
  colDome.scale.set(1, 0.45, 1);
  processGroup.add(colDome);

  // Catwalk Platforms & Safety Handrails
  [4.5, 9.0, 13.5, 17.5].forEach((py) => {
    const platGeo = new THREE.CylinderGeometry(2.7, 2.7, 0.25, 20);
    const platMesh = new THREE.Mesh(platGeo, mats.steelDark);
    platMesh.position.y = py;
    processGroup.add(platMesh);

    const railGeo = new THREE.TorusGeometry(2.65, 0.06, 6, 20);
    const railMesh = new THREE.Mesh(railGeo, mats.hazardStripe);
    railMesh.rotation.x = Math.PI / 2;
    railMesh.position.y = py + 0.45;
    processGroup.add(railMesh);
  });

  // Secondary Stripping Tower
  const tower2Geo = new THREE.CylinderGeometry(1.5, 1.5, 14, 20);
  const tower2Mesh = new THREE.Mesh(tower2Geo, mats.steelDark);
  tower2Mesh.position.set(5.5, 7.0, 2);
  tower2Mesh.castShadow = true;
  processGroup.add(tower2Mesh);

  // Horizontal Reboilers / Exchangers
  [-3.5, 2.5].forEach((hx, idx) => {
    const exchGroup = new THREE.Group();
    exchGroup.position.set(hx, 2.0, 6 + idx * 3.5);
    const exchGeo = new THREE.CylinderGeometry(1.1, 1.1, 4.8, 16);
    const exchMesh = new THREE.Mesh(exchGeo, mats.steelLight);
    exchMesh.rotation.z = Math.PI / 2;
    exchGroup.add(exchMesh);

    // Support Saddles
    const sad1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 1.8), mats.concrete);
    sad1.position.set(-1.5, -1.0, 0);
    exchGroup.add(sad1);
    const sad2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.0, 1.8), mats.concrete);
    sad2.position.set(1.5, -1.0, 0);
    exchGroup.add(sad2);

    processGroup.add(exchGroup);
  });

  if (layers.equipment) scene.add(processGroup);

  // =========================================================================
  // 4. FLARE STACK TOWER & HIGH-VISIBILITY ANIMATED FLAME
  // =========================================================================
  const flareGroup = new THREE.Group();
  flareGroup.position.set(52, 0, -5);

  // Lattice Structure
  const flareTowerGeo = new THREE.CylinderGeometry(0.4, 1.8, 25, 4);
  const flareTowerMesh = new THREE.Mesh(flareTowerGeo, mats.steelDark);
  flareTowerMesh.position.y = 12.5;
  flareGroup.add(flareTowerMesh);

  // Tip
  const tipGeo = new THREE.CylinderGeometry(0.65, 0.45, 1.6, 8);
  const tipMesh = new THREE.Mesh(tipGeo, mats.steelLight);
  tipMesh.position.y = 25.5;
  flareGroup.add(tipMesh);

  // Animated Glowing Flame Mesh
  const flameGeo = new THREE.ConeGeometry(0.9, 2.8, 8);
  const flameMesh = new THREE.Mesh(flameGeo, mats.flareGlow);
  flameMesh.position.y = 27.2;
  flareGroup.add(flameMesh);

  // Dynamic Point Light for Flare Glow
  const flareLight = new THREE.PointLight(isLight ? 0xff4500 : 0xff6a00, isLight ? 1.5 : 2.0, 25);
  flareLight.position.set(0, 27, 0);
  flareGroup.add(flareLight);

  if (layers.equipment) scene.add(flareGroup);

  // =========================================================================
  // 5. WELLHEAD CHRISTMAS TREE AREA (Z-01)
  // =========================================================================
  const wellheadGroup = new THREE.Group();
  wellheadGroup.position.set(-32, 0, -25);

  // Wellpad Cellar Pad
  const wellPad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 22), mats.concrete);
  wellPad.position.y = 0.17;
  wellheadGroup.add(wellPad);

  // Xmas Trees WH-01 to WH-04
  const wellCoords = [
    { x: -6, z: -4 },
    { x: 2, z: -4 },
    { x: -6, z: 4 },
    { x: 2, z: 4 },
  ];

  wellCoords.forEach((coord) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(coord.x, 0.35, coord.z);

    // Casing Flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.7, 12), mats.steelDark);
    flange.position.y = 0.35;
    treeGroup.add(flange);

    // Master Stem
    const masterStem = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.6, 12), mats.steelLight);
    masterStem.position.y = 1.8;
    treeGroup.add(masterStem);

    // Wing Valves
    const wingStem = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.0, 8), mats.pipeOrange);
    wingStem.rotation.z = Math.PI / 2;
    wingStem.position.y = 2.4;
    treeGroup.add(wingStem);

    // Handwheels
    const wheelGeo = new THREE.TorusGeometry(0.32, 0.045, 6, 12);
    const wheel1 = new THREE.Mesh(wheelGeo, mats.pipeOrange);
    wheel1.rotation.y = Math.PI / 2;
    wheel1.position.set(-1.05, 2.4, 0);
    treeGroup.add(wheel1);

    const wheel2 = new THREE.Mesh(wheelGeo, mats.pipeOrange);
    wheel2.rotation.y = Math.PI / 2;
    wheel2.position.set(1.05, 2.4, 0);
    treeGroup.add(wheel2);

    wellheadGroup.add(treeGroup);
  });

  // BOP Annular Preventer Stack
  const bopGroup = new THREE.Group();
  bopGroup.position.set(7, 0.35, 0);
  const bopBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 2.8), mats.steelDark);
  bopBase.position.y = 1.9;
  bopGroup.add(bopBase);
  const bopAnnular = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 16), mats.steelLight);
  bopAnnular.position.y = 4.4;
  bopGroup.add(bopAnnular);
  wellheadGroup.add(bopGroup);

  if (layers.equipment) scene.add(wellheadGroup);

  // =========================================================================
  // 6. PUMP & COMPRESSOR STATION (Z-02)
  // =========================================================================
  const pumpGroup = new THREE.Group();
  pumpGroup.position.set(0, 0, -25);

  const pumpPad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 22), mats.concrete);
  pumpPad.position.y = 0.17;
  pumpGroup.add(pumpPad);

  // Centrifugal Pump Skids P-201A & P-201B
  [-5.5, 5.5].forEach((px) => {
    const skidGroup = new THREE.Group();
    skidGroup.position.set(px, 0.35, 0);

    const skidBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 7.2), mats.steelDark);
    skidBase.position.y = 0.22;
    skidGroup.add(skidBase);

    // Motor
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.0, 16), mats.steelLight);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(0, 1.5, -1.7);
    skidGroup.add(motor);

    // Terminal Box
    const tbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mats.hazardStripe);
    tbox.position.set(1.0, 2.3, -1.7);
    skidGroup.add(tbox);

    // Coupling Guard
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.9, 12), mats.pipeOrange);
    coupling.rotation.x = Math.PI / 2;
    coupling.position.set(0, 1.4, 0.3);
    skidGroup.add(coupling);

    // Pump Volute
    const volute = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.3, 16), mats.steelDark);
    volute.rotation.z = Math.PI / 2;
    volute.position.set(0, 1.5, 1.7);
    skidGroup.add(volute);

    // Discharge Pipe
    const disPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.2, 12), mats.pipeOrange);
    disPipe.position.set(0, 2.8, 1.7);
    skidGroup.add(disPipe);

    pumpGroup.add(skidGroup);
  });

  if (layers.equipment) scene.add(pumpGroup);

  // =========================================================================
  // 7. PIPELINE CORRIDOR & MULTI-TIER PIPE RACKS (Z-04)
  // =========================================================================
  const pipeCorridorGroup = new THREE.Group();
  pipeCorridorGroup.position.set(0, 0, 2);

  const rackLength = 76;
  const bentSpacing = 8;
  const numBents = Math.floor(rackLength / bentSpacing);

  for (let i = 0; i <= numBents; i++) {
    const bx = -rackLength / 2 + i * bentSpacing;
    const bentGroup = new THREE.Group();
    bentGroup.position.set(bx, 0, 0);

    const colL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.4, 0.35), mats.steelDark);
    colL.position.set(0, 2.2, -2.6);
    bentGroup.add(colL);

    const colR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.4, 0.35), mats.steelDark);
    colR.position.set(0, 2.2, 2.6);
    bentGroup.add(colR);

    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5.6), mats.steelDark);
    beam1.position.set(0, 2.3, 0);
    bentGroup.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5.6), mats.steelDark);
    beam2.position.set(0, 4.0, 0);
    bentGroup.add(beam2);

    pipeCorridorGroup.add(bentGroup);
  }

  // Colorful Process Pipelines
  const pipeConfigs = [
    { z: -1.9, y: 2.6, radius: 0.38, mat: mats.pipeOrange },
    { z: -0.6, y: 2.6, radius: 0.30, mat: mats.pipeYellow },
    { z: 0.6, y: 2.6, radius: 0.34, mat: mats.pipeSilver },
    { z: 1.9, y: 2.6, radius: 0.28, mat: mats.pipeBlue },
    { z: -1.2, y: 4.3, radius: 0.32, mat: mats.pipeOrange },
    { z: 1.2, y: 4.3, radius: 0.30, mat: mats.pipeSilver },
  ];

  pipeConfigs.forEach((cfg) => {
    const pipeGeo = new THREE.CylinderGeometry(cfg.radius, cfg.radius, rackLength + 4, 16);
    const pipeMesh = new THREE.Mesh(pipeGeo, cfg.mat);
    pipeMesh.rotation.z = Math.PI / 2;
    pipeMesh.position.set(0, cfg.y, cfg.z);
    pipeCorridorGroup.add(pipeMesh);

    // Glowing Flow Animation Collar
    const collarGeo = new THREE.CylinderGeometry(cfg.radius + 0.09, cfg.radius + 0.09, 1.8, 16);
    const collarMesh = new THREE.Mesh(collarGeo, mats.pipeGlow);
    collarMesh.rotation.z = Math.PI / 2;
    collarMesh.position.set(0, cfg.y, cfg.z);
    pipeCorridorGroup.add(collarMesh);
    pipeFlowCollars.push(collarMesh);
  });

  if (layers.pipelines) scene.add(pipeCorridorGroup);

  // =========================================================================
  // 8. SCADA & SIS CONTROL COMMAND BUILDING (Z-05)
  // =========================================================================
  const controlGroup = new THREE.Group();
  controlGroup.position.set(-32, 0, 28);

  const bldgGeo = new THREE.BoxGeometry(18, 5.2, 14);
  const bldgMesh = new THREE.Mesh(bldgGeo, mats.buildingWall);
  bldgMesh.position.y = 2.6;
  bldgMesh.castShadow = true;
  controlGroup.add(bldgMesh);

  const roofGeo = new THREE.BoxGeometry(18.8, 0.45, 14.8);
  const roofMesh = new THREE.Mesh(roofGeo, mats.buildingRoof);
  roofMesh.position.y = 5.4;
  controlGroup.add(roofMesh);

  const winGeo = new THREE.BoxGeometry(14, 1.5, 0.25);
  const winMesh = new THREE.Mesh(winGeo, mats.buildingGlass);
  winMesh.position.set(0, 3.4, -7.05);
  controlGroup.add(winMesh);

  // Satellite Transceiver Dish
  const dishGroup = new THREE.Group();
  dishGroup.position.set(4, 5.6, 2);
  const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8), mats.steelDark);
  dishMast.position.y = 1.2;
  dishGroup.add(dishMast);

  const dishBowl = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), mats.tankWhite);
  dishBowl.rotation.x = Math.PI / 3;
  dishBowl.position.y = 2.4;
  dishGroup.add(dishBowl);
  controlGroup.add(dishGroup);

  if (layers.equipment) scene.add(controlGroup);

  // =========================================================================
  // 9. MECHANICAL WORKSHOP & CRANE BAY (Z-06)
  // =========================================================================
  const maintGroup = new THREE.Group();
  maintGroup.position.set(0, 0, 28);

  const shopGeo = new THREE.BoxGeometry(18, 6.8, 14);
  const shopMesh = new THREE.Mesh(shopGeo, mats.buildingWall);
  shopMesh.position.y = 3.4;
  maintGroup.add(shopMesh);

  const doorGeo = new THREE.BoxGeometry(8.5, 4.8, 0.25);
  const doorMesh = new THREE.Mesh(doorGeo, mats.steelDark);
  doorMesh.position.set(0, 2.4, -7.05);
  maintGroup.add(doorMesh);

  // Crane Gantry Structure
  const craneGroup = new THREE.Group();
  craneGroup.position.set(0, 0, -10);

  [[-7, -3], [-7, 3], [7, -3], [7, 3]].forEach(([cx, cz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 6.2, 0.45), mats.pipeOrange);
    leg.position.set(cx, 3.1, cz);
    craneGroup.add(leg);
  });

  const run1 = new THREE.Mesh(new THREE.BoxGeometry(15, 0.45, 0.45), mats.pipeOrange);
  run1.position.set(0, 6.2, -3);
  craneGroup.add(run1);
  const run2 = new THREE.Mesh(new THREE.BoxGeometry(15, 0.45, 0.45), mats.pipeOrange);
  run2.position.set(0, 6.2, 3);
  craneGroup.add(run2);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 6.6), mats.hazardStripe);
  bridge.position.set(1.5, 6.4, 0);
  craneGroup.add(bridge);

  maintGroup.add(craneGroup);

  if (layers.equipment) scene.add(maintGroup);

  // =========================================================================
  // 10. ROAD TANKER LOADING GANTRY (Z-07)
  // =========================================================================
  const loadingGroup = new THREE.Group();
  loadingGroup.position.set(35, 0, 28);

  const islandPad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.35, 20), mats.concrete);
  islandPad.position.y = 0.17;
  loadingGroup.add(islandPad);

  const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(20, 0.45, 14), mats.buildingRoof);
  canopyRoof.position.y = 6.0;
  loadingGroup.add(canopyRoof);

  [[-8, -5], [-8, 5], [8, -5], [8, 5]].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.8, 12), mats.steelDark);
    col.position.set(cx, 2.9, cz);
    loadingGroup.add(col);
  });

  // Road Tanker Trucks
  [-4.5, 4.5].forEach((tx) => {
    const truck = new THREE.Group();
    truck.position.set(tx, 0.35, 1.5);

    const tbar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7.0, 16), mats.steelLight);
    tbar.rotation.x = Math.PI / 2;
    tbar.position.set(0, 1.7, -0.5);
    truck.add(tbar);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.4), mats.truckCab);
    cab.position.set(0, 1.4, 4.0);
    truck.add(cab);

    loadingGroup.add(truck);
  });

  if (layers.equipment) scene.add(loadingGroup);

  return {
    flareFlameMesh: flameMesh,
    pipeFlowCollars,
  };
}
