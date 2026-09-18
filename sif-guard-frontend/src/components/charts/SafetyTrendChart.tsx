import React from 'react';
import { InsightChartWrapper } from './InsightChartWrapper';
import type { TrendData } from '../../types/api';

interface SafetyTrendChartProps {
  data?: TrendData[];
  loading?: boolean;
  onSelectPeriod?: (period: string) => void;
}

export const SafetyTrendChart: React.FC<SafetyTrendChartProps> = ({
  data = [],
  loading = false,
  onSelectPeriod,
}) => {
  const periods = data.map((d) => d.period);
  const totalReports = data.map((d) => d.total_reports);
  const sifPrecursors = data.map((d) => d.sif_precursors);
  const sifDensity = data.map((d) => Math.round(d.sif_density * 100));

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#94a3b8' } },
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#0f172a', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,51,102,0.12); border-radius: 6px;',
      formatter: (params: any[]) => {
        let res = `<div style="font-weight:700;margin-bottom:4px;color:#003366">${params[0]?.name || ''}</div>`;
        params.forEach((item) => {
          const val = item.seriesName.includes('Density') ? `${item.value}%` : item.value;
          res += `<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-top:3px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${item.color}"></span>
            <span style="color:#475569">${item.seriesName}:</span>
            <span style="font-weight:700;color:#0f172a;margin-left:auto">${val}</span>
          </div>`;
        });
        return res;
      },
    },
    legend: {
      data: ['Total Reports', 'SIF Potential', 'SIF Precursor Density (%)'],
      textStyle: { color: '#475569', fontSize: 11, fontWeight: 600 },
      top: 0,
      right: 0,
    },
    xAxis: {
      type: 'category',
      data: periods.length ? periods : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisPointer: { type: 'shadow' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Reports',
        min: 0,
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Density (%)',
        min: 0,
        max: 100,
        axisLabel: { color: '#64748b', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Total Reports',
        type: 'bar',
        barWidth: '24%',
        itemStyle: {
          color: '#003366',
          borderRadius: [4, 4, 0, 0],
        },
        data: totalReports.length ? totalReports : [42, 58, 65, 80, 95, 110],
      },
      {
        name: 'SIF Potential',
        type: 'bar',
        barWidth: '24%',
        itemStyle: {
          color: '#dc2626',
          borderRadius: [4, 4, 0, 0],
        },
        data: sifPrecursors.length ? sifPrecursors : [12, 18, 14, 25, 31, 38],
      },
      {
        name: 'SIF Precursor Density (%)',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 7,
        itemStyle: { color: '#ff9933' },
        lineStyle: { width: 2.5, color: '#ff9933' },
        data: sifDensity.length ? sifDensity : [28, 31, 21, 31, 32, 34],
      },
    ],
  };

  const handleChartClick = (params: any) => {
    if (params && params.name && onSelectPeriod) {
      onSelectPeriod(params.name);
    }
  };

  return (
    <InsightChartWrapper
      title="Safety Signal Temporal Trend"
      subtitle="Temporal frequency of total reports, high SIF potential signals, and precursor density."
      option={option}
      height={320}
      loading={loading}
      onChartClick={handleChartClick}
    />
  );
};
