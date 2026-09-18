import React from 'react';
import { InsightChartWrapper } from './InsightChartWrapper';

interface BarrierHealthItem {
  barrier: string;
  observed: number;
  failed: number;
  effective: number;
  unknown: number;
}

interface BarrierHealthChartProps {
  data?: BarrierHealthItem[];
  loading?: boolean;
}

export const BarrierHealthChart: React.FC<BarrierHealthChartProps> = ({
  data = [
    { barrier: 'Pressure Isolation', observed: 28, failed: 17, effective: 9, unknown: 2 },
    { barrier: 'Atmospheric Testing', observed: 22, failed: 12, effective: 8, unknown: 2 },
    { barrier: 'Fall Protection', observed: 19, failed: 9, effective: 8, unknown: 2 },
    { barrier: 'Machine Guarding', observed: 15, failed: 7, effective: 6, unknown: 2 },
    { barrier: 'Barricading', observed: 14, failed: 5, effective: 7, unknown: 2 },
  ],
  loading = false,
}) => {
  const categories = data.map((d) => d.barrier);
  const failed = data.map((d) => d.failed);
  const effective = data.map((d) => d.effective);
  const unknown = data.map((d) => d.unknown);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#0f172a', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,51,102,0.12); border-radius: 6px;',
    },
    legend: {
      data: ['Failed / Defective', 'Effective / Intact', 'Unverified / Unknown'],
      textStyle: { color: '#475569', fontSize: 11, fontWeight: 600 },
      top: 0,
      right: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#0f172a', fontSize: 11, fontWeight: 500 },
    },
    series: [
      {
        name: 'Failed / Defective',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        itemStyle: { color: '#dc2626', borderRadius: [0, 0, 0, 0] },
        data: failed,
      },
      {
        name: 'Effective / Intact',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        itemStyle: { color: '#16a34a', borderRadius: [0, 0, 0, 0] },
        data: effective,
      },
      {
        name: 'Unverified / Unknown',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        itemStyle: { color: '#ff9933', borderRadius: [0, 4, 4, 0] },
        data: unknown,
      },
    ],
  };

  return (
    <InsightChartWrapper
      title="Barrier Control Status Breakdown"
      subtitle="Distinction between controls that were explicitly mentioned vs ineffective vs verified intact."
      option={option}
      height={280}
      loading={loading}
    />
  );
};
