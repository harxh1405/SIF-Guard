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
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#0f172a', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,51,102,0.12); border-radius: 6px;',
      formatter: (params: any[]) => {
        const item = params[0];
        const itemData = sorted.find((s) => s.barrier_failure === item.name);
        const density = itemData ? Math.round(itemData.sif_density * 100) : 0;

        return `<div style="font-weight:700;color:#003366;margin-bottom:4px">${item.name}</div>
          <div style="font-size:12px;color:#475569">Total Reports: <strong style="color:#0f172a">${itemData?.total_reports || 0}</strong></div>
          <div style="font-size:12px;color:#475569">SIF Potential: <strong style="color:#dc2626">${itemData?.sif_count || 0}</strong></div>
          <div style="font-size:12px;color:#475569">Precursor Density: <strong style="color:#b45309">${density}%</strong></div>
          <div style="font-size:11px;color:#16a34a;margin-top:5px;font-weight:600">Click to filter dashboard by this barrier</div>`;
      },
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: categories.length ? categories : ['Pressure Isolation', 'Atmospheric Testing', 'Fall Protection', 'Machine Guarding', 'Barricading'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: {
        color: (val: string) => (selectedBarriers.includes(val) ? '#b45309' : '#0f172a'),
        fontWeight: (val: string) => (selectedBarriers.includes(val) ? 700 : 500),
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
          color: (params: any) => (selectedBarriers.includes(params.name) ? '#ff9933' : '#dc2626'),
          borderRadius: [0, 4, 4, 0],
        },
      },
      {
        name: 'Total Observations',
        type: 'bar',
        data: totalCounts.length ? totalCounts : [24, 18, 15, 12, 9],
        itemStyle: {
          color: '#003366',
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
