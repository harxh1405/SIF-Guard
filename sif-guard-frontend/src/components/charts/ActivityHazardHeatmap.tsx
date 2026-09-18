import React from 'react';
import { InsightChartWrapper } from './InsightChartWrapper';

interface ActivityHazardHeatmapProps {
  activities?: string[];
  hazards?: string[];
  matrixData?: number[][];
  loading?: boolean;
  onSelectCell?: (activity: string, hazard: string) => void;
}

export const ActivityHazardHeatmap: React.FC<ActivityHazardHeatmapProps> = ({
  activities = ['Maintenance', 'Hot Work', 'Lifting', 'Excavation', 'Valve Ops', 'Tank Cleaning'],
  hazards = ['Pressurized System', 'Flammable Gas', 'Working at Height', 'Heavy Load', 'Confined Space', 'Toxic Gas'],
  matrixData,
  loading = false,
  onSelectCell,
}) => {
  // Generate sample matrix matching sizes if missing
  const defaultMatrix: number[][] = [];
  for (let i = 0; i < activities.length; i++) {
    for (let j = 0; j < hazards.length; j++) {
      const val = Math.floor(Math.random() * 14);
      defaultMatrix.push([i, j, val]);
    }
  }

  const seriesData = matrixData || defaultMatrix;
  const maxVal = Math.max(...seriesData.map((d) => d[2]), 1);

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const actName = activities[params.value[0]] || 'Activity';
        const hazName = hazards[params.value[1]] || 'Hazard';
        const val = params.value[2];
        return `<div style="font-weight:600;color:#F4F3EE;margin-bottom:4px">${actName} × ${hazName}</div>
          <div style="font-size:12px;color:#9CA8AA">Report Signals: <strong style="color:#F2A933">${val}</strong></div>
          <div style="font-size:11px;color:#4DCEA0;margin-top:4px">Click to filter dashboard reports</div>`;
      },
    },
    grid: {
      top: '10%',
      bottom: '15%',
      left: '12%',
      right: '4%',
    },
    xAxis: {
      type: 'category',
      data: activities,
      splitArea: { show: true },
      axisLabel: { color: '#9CA8AA', rotate: 25, fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: hazards,
      splitArea: { show: true },
      axisLabel: { color: '#9CA8AA', fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      show: false,
      inRange: {
        color: ['#0D171A', '#112429', '#203238', '#F2A933', '#E54F4F'],
      },
    },
    series: [
      {
        name: 'Activity Hazard Exposure',
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          color: '#F4F3EE',
          fontSize: 11,
          formatter: (params: any) => (params.value[2] > 0 ? params.value[2] : ''),
        },
        itemStyle: {
          borderColor: '#0D171A',
          borderWidth: 2,
          borderRadius: 2,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(242, 169, 51, 0.5)',
          },
        },
      },
    ],
  };

  const handleChartClick = (params: any) => {
    if (params && params.value && onSelectCell) {
      const act = activities[params.value[0]];
      const haz = hazards[params.value[1]];
      if (act && haz) {
        onSelectCell(act, haz);
      }
    }
  };

  return (
    <InsightChartWrapper
      title="Activity × Hazard Signal Matrix"
      subtitle="Density of safety report observations mapped across operational activities and environmental hazards."
      option={option}
      height={320}
      loading={loading}
      onChartClick={handleChartClick}
    />
  );
};
