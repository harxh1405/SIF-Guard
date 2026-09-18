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
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#0f172a', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,51,102,0.12); border-radius: 6px;',
      formatter: (params: any) => {
        const actName = activities[params.value[0]] || 'Activity';
        const hazName = hazards[params.value[1]] || 'Hazard';
        const val = params.value[2];
        return `<div style="font-weight:700;color:#003366;margin-bottom:4px">${actName} × ${hazName}</div>
          <div style="font-size:12px;color:#475569">Precursor Reports: <strong style="color:#b45309">${val}</strong></div>
          <div style="font-size:11px;color:#16a34a;margin-top:4px;font-weight:600">Click to filter dashboard reports</div>`;
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
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', rotate: 25, fontSize: 11, fontWeight: 500 },
    },
    yAxis: {
      type: 'category',
      data: hazards,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#0f172a', fontSize: 11, fontWeight: 500 },
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
        color: ['#f1f5f9', '#e0f2fe', '#fef3c7', '#ff9933', '#dc2626'],
      },
    },
    series: [
      {
        name: 'Activity Hazard Exposure',
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          color: '#0f172a',
          fontSize: 11,
          fontWeight: 700,
          formatter: (params: any) => (params.value[2] > 0 ? params.value[2] : ''),
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 2,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 51, 102, 0.3)',
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
