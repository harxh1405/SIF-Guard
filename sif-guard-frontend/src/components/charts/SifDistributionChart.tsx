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
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#0f172a', fontSize: 12 },
      extraCssText: 'box-shadow: 0 6px 20px rgba(0,51,102,0.12); border-radius: 6px;',
      formatter: (params: any) => {
        return `<div style="font-weight:700;color:#003366">${params.name}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px">Report Count: <strong style="color:#0f172a">${params.value}</strong></div>
          <div style="font-size:12px;color:#475569">Share: <strong style="color:${params.color}">${params.percent}%</strong></div>
          <div style="font-size:11px;color:#16a34a;margin-top:4px;font-weight:600">Click segment to filter report list</div>`;
      },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#475569', fontSize: 11, fontWeight: 600 },
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
          borderColor: '#ffffff',
          borderWidth: 3,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '15',
            fontWeight: 'bold',
            color: '#003366',
            formatter: '{b}\n{d}%',
          },
        },
        data: [
          { value: sifCount, name: 'SIF Potential', itemStyle: { color: '#dc2626' } },
          { value: nonSifCount, name: 'Non-SIF Precursor', itemStyle: { color: '#16a34a' } },
          { value: uncertainCount, name: 'Uncertain / Review', itemStyle: { color: '#ff9933' } },
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
