import React from 'react';
import { InsightChartWrapper } from './InsightChartWrapper';

interface SifDistributionChartProps {
  sifCount?: number;
  nonSifCount?: number;
  uncertainCount?: number;
  loading?: boolean;
  onSelectCategory?: (category: string) => void;
}

export const SifDistributionChart: React.FC<SifDistributionChartProps> = ({
  sifCount = 38,
  nonSifCount = 74,
  uncertainCount = 12,
  loading = false,
  onSelectCategory,
}) => {
  const total = sifCount + nonSifCount + uncertainCount;
  const sifPct = total > 0 ? Math.round((sifCount / total) * 100) : 0;
  const nonSifPct = total > 0 ? Math.round((nonSifCount / total) * 100) : 0;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `<div style="font-weight:600;color:#F4F3EE">${params.name}</div>
          <div style="font-size:12px;color:#9CA8AA">Report Count: <strong style="color:#F4F3EE">${params.value}</strong></div>
          <div style="font-size:12px;color:#9CA8AA">Share: <strong style="color:${params.color}">${params.percent}%</strong></div>
          <div style="font-size:11px;color:#4DCEA0;margin-top:4px">Click segment to filter report list</div>`;
      },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#9CA8AA', fontSize: 11 },
    },
    series: [
      {
        name: 'SIF Classification',
        type: 'pie',
        radius: ['55%', '82%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0D171A',
          borderWidth: 3,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
            color: '#F4F3EE',
            formatter: '{b}\n{d}%',
          },
        },
        data: [
          { value: sifCount, name: 'SIF Potential', itemStyle: { color: '#E54F4F' } },
          { value: nonSifCount, name: 'Non-SIF Precursor', itemStyle: { color: '#4DCEA0' } },
          { value: uncertainCount, name: 'Uncertain / Review', itemStyle: { color: '#E8AA3D' } },
        ],
      },
    ],
  };

  const handleChartClick = (params: any) => {
    if (params && params.name && onSelectCategory) {
      const catMap: Record<string, string> = {
        'SIF Potential': 'SIF_POTENTIAL',
        'Non-SIF Precursor': 'NON_SIF',
        'Uncertain / Review': 'UNCERTAIN',
      };
      onSelectCategory(catMap[params.name] || params.name);
    }
  };

  return (
    <InsightChartWrapper
      title="SIF Potential Risk Distribution"
      subtitle="XGBoost model classification portfolio across analyzed safety observations."
      option={option}
      height={280}
      loading={loading}
      onChartClick={handleChartClick}
      headerAction={
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ color: '#E54F4F', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(229,79,79,0.12)', border: '1px solid rgba(229,79,79,0.3)' }}>
            {sifPct}% SIF
          </span>
          <span style={{ color: '#4DCEA0', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(77,206,160,0.12)', border: '1px solid rgba(77,206,160,0.3)' }}>
            {nonSifPct}% Non-SIF
          </span>
        </div>
      }
    />
  );
};
