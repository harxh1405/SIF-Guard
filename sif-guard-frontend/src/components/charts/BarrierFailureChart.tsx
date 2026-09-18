import React from 'react';
import { InsightChartWrapper } from './InsightChartWrapper';
import type { BarrierRanking } from '../../types/api';

interface BarrierFailureChartProps {
  data?: BarrierRanking[];
  loading?: boolean;
  onSelectBarrier?: (barrier: string) => void;
  selectedBarriers?: string[];
}

export const BarrierFailureChart: React.FC<BarrierFailureChartProps> = ({
  data = [],
  loading = false,
  onSelectBarrier,
  selectedBarriers = [],
}) => {
  // Sort and pick top barriers
  const sorted = [...data].slice(0, 8).reverse();
  const categories = sorted.map((d) => d.barrier_failure);
  const totalCounts = sorted.map((d) => d.total_reports);
  const sifCounts = sorted.map((d) => d.sif_count);

  const option = {
    grid: {
      left: '3%',
      right: '6%',
      bottom: '3%',
      top: '6%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const item = params[0];
        const itemData = sorted.find((s) => s.barrier_failure === item.name);
        const density = itemData ? Math.round(itemData.sif_density * 100) : 0;

        return `<div style="font-weight:600;color:#F4F3EE;margin-bottom:4px">${item.name}</div>
          <div style="font-size:12px;color:#9CA8AA">Total Reports: <strong style="color:#F4F3EE">${itemData?.total_reports || 0}</strong></div>
          <div style="font-size:12px;color:#9CA8AA">SIF Potential: <strong style="color:#E54F4F">${itemData?.sif_count || 0}</strong></div>
          <div style="font-size:12px;color:#9CA8AA">Precursor Density: <strong style="color:#F2A933">${density}%</strong></div>
          <div style="font-size:11px;color:#4DCEA0;margin-top:6px">Click to filter dashboard by this barrier</div>`;
      },
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel: { color: '#9CA8AA' },
      splitLine: { lineStyle: { color: '#203238', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: categories.length ? categories : ['Pressure Isolation', 'Atmospheric Testing', 'Fall Protection', 'Machine Guarding', 'Barricading'],
      axisLabel: {
        color: (val: string) => (selectedBarriers.includes(val) ? '#F2A933' : '#F4F3EE'),
        fontWeight: (val: string) => (selectedBarriers.includes(val) ? 600 : 400),
        width: 140,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: 'Failed Barriers (SIF)',
        type: 'bar',
        data: sifCounts.length ? sifCounts : [17, 12, 9, 7, 5],
        itemStyle: {
          color: (params: any) => (selectedBarriers.includes(params.name) ? '#F2A933' : '#E54F4F'),
          borderRadius: [0, 4, 4, 0],
        },
      },
      {
        name: 'Total Observations',
        type: 'bar',
        data: totalCounts.length ? totalCounts : [24, 18, 15, 12, 9],
        itemStyle: {
          color: '#112429',
          borderColor: '#203238',
          borderWidth: 1,
          borderRadius: [0, 4, 4, 0],
        },
      },
    ],
  };

  const handleChartClick = (params: any) => {
    if (params && params.name && onSelectBarrier) {
      onSelectBarrier(params.name);
    }
  };

  return (
    <InsightChartWrapper
      title="Where Controls Are Failing"
      subtitle="Failed safety barrier observations ranked by occurrence and SIF risk density."
      option={option}
      height={320}
      loading={loading}
      onChartClick={handleChartClick}
    />
  );
};
