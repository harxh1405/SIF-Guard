export interface Zone3DConfig {
  id: string;
  code: string;
  name: string;
  center: [number, number, number];
  size: [number, number, number];
  labelPos: [number, number, number];
  cameraFocus: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export const ZONE_3D_CONFIGS: Record<string, Zone3DConfig> = {
  'wellhead-area': {
    id: 'wellhead-area',
    code: 'Z-01',
    name: 'Wellhead Christmas Tree Area',
    center: [-32, 0, -25],
    size: [26, 0.4, 24],
    labelPos: [-32, 7, -25],
    cameraFocus: {
      position: [-32, 22, 5],
      target: [-32, 1, -25],
    },
  },
  'pump-station': {
    id: 'pump-station',
    code: 'Z-02',
    name: 'Main Pump & Compressor Station',
    center: [0, 0, -25],
    size: [26, 0.4, 24],
    labelPos: [0, 7, -25],
    cameraFocus: {
      position: [0, 22, 5],
      target: [0, 1, -25],
    },
  },
  'tank-farm': {
    id: 'tank-farm',
    code: 'Z-03',
    name: 'Hydrocarbon Storage Tank Farm',
    center: [35, 0, -25],
    size: [32, 0.4, 26],
    labelPos: [35, 11, -25],
    cameraFocus: {
      position: [35, 26, 5],
      target: [35, 3, -25],
    },
  },
  'pipeline-corridor': {
    id: 'pipeline-corridor',
    code: 'Z-04',
    name: 'Main Multi-Tier Pipeline Corridor',
    center: [0, 0, 2],
    size: [80, 0.4, 14],
    labelPos: [0, 6.5, 2],
    cameraFocus: {
      position: [0, 20, 25],
      target: [0, 1, 2],
    },
  },
  'control-room': {
    id: 'control-room',
    code: 'Z-05',
    name: 'Central SCADA & SIS Control Hub',
    center: [-32, 0, 28],
    size: [24, 0.4, 22],
    labelPos: [-32, 8, 28],
    cameraFocus: {
      position: [-32, 20, 55],
      target: [-32, 1, 28],
    },
  },
  'maintenance-area': {
    id: 'maintenance-area',
    code: 'Z-06',
    name: 'Mechanical Workshop & Crane Bay',
    center: [0, 0, 28],
    size: [26, 0.4, 22],
    labelPos: [0, 9, 28],
    cameraFocus: {
      position: [0, 20, 55],
      target: [0, 1, 28],
    },
  },
  'loading-area': {
    id: 'loading-area',
    code: 'Z-07',
    name: 'Road Tanker Gantry Terminal',
    center: [35, 0, 28],
    size: [30, 0.4, 24],
    labelPos: [35, 8.5, 28],
    cameraFocus: {
      position: [35, 20, 55],
      target: [35, 1, 28],
    },
  },
};

export const CAMERA_PRESETS = [
  {
    id: 'overview',
    label: 'Overview View',
    position: [0, 68, 68] as [number, number, number],
    target: [0, 0, 2] as [number, number, number],
  },
  {
    id: 'wellhead-area',
    label: 'Wellhead (Z-01)',
    position: [-32, 22, 5] as [number, number, number],
    target: [-32, 1, -25] as [number, number, number],
  },
  {
    id: 'pump-station',
    label: 'Pump Station (Z-02)',
    position: [0, 22, 5] as [number, number, number],
    target: [0, 1, -25] as [number, number, number],
  },
  {
    id: 'tank-farm',
    label: 'Tank Farm (Z-03)',
    position: [35, 26, 5] as [number, number, number],
    target: [35, 3, -25] as [number, number, number],
  },
  {
    id: 'pipeline-corridor',
    label: 'Pipelines (Z-04)',
    position: [0, 20, 25] as [number, number, number],
    target: [0, 1, 2] as [number, number, number],
  },
  {
    id: 'control-room',
    label: 'Control Room (Z-05)',
    position: [-32, 20, 55] as [number, number, number],
    target: [-32, 1, 28] as [number, number, number],
  },
  {
    id: 'maintenance-area',
    label: 'Maintenance (Z-06)',
    position: [0, 20, 55] as [number, number, number],
    target: [0, 1, 28] as [number, number, number],
  },
  {
    id: 'loading-area',
    label: 'Loading Bay (Z-07)',
    position: [35, 20, 55] as [number, number, number],
    target: [35, 1, 28] as [number, number, number],
  },
];
