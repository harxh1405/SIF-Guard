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
      axisPointer: { type: 'cross', crossStyle: { color: '#9CA8AA' } },
      formatter: (params: any[]) => {
        let res = `<div style="font-weight:600;margin-bottom:4px;color:#F4F3EE">${params[0]?.name || ''}</div>`;
        params.forEach((item) => {
          const val = item.seriesName.includes('Density') ? `${item.value}%` : item.value;
          res += `<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-top:3px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${item.color}"></span>
            <span style="color:#9CA8AA">${item.seriesName}:</span>
            <span style="font-weight:600;color:#F4F3EE;margin-left:auto">${val}</span>
          </div>`;
        });
        return res;
      },
    },
    legend: {
      data: ['Total Reports', 'SIF Potential', 'SIF Precursor Density (%)'],
      textStyle: { color: '#9CA8AA', fontSize: 11 },
      top: 0,
      right: 0,
    },
    xAxis: {
      type: 'category',
      data: periods.length ? periods : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisPointer: { type: 'shadow' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Reports',
        min: 0,
        axisLabel: { color: '#9CA8AA' },
        splitLine: { lineStyle: { color: '#203238', type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'Density (%)',
        min: 0,
        max: 100,
        axisLabel: { color: '#9CA8AA', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Total Reports',
        type: 'bar',
        barWidth: '24%',
        itemStyle: {
          color: '#112429',
          borderColor: '#203238',
          borderWidth: 1,
          borderRadius: [4, 4, 0, 0],
        },
        data: totalReports.length ? totalReports : [42, 58, 65, 80, 95, 110],
      },
      {
        name: 'SIF Potential',
        type: 'bar',
        barWidth: '24%',
        itemStyle: {
          color: '#E54F4F',
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
        itemStyle: { color: '#F2A933' },
        lineStyle: { width: 2, color: '#F2A933' },
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
