import React, { useMemo } from 'react';
import type { EChartsOption } from './echartsCore';
import { EChartWrapper } from './EChartWrapper';
import { getChartThemeTokens } from './echartsTheme';
import { buildEnterpriseTooltipHtml, formatCount } from './chartUtils';
import type { HazardRanking } from '../../types/api';

interface Props {
  data: HazardRanking[];
  theme?: 'dark' | 'light';
  height?: string;
  selectedHazard?: string | null;
  onHazardSelect?: (hazard: string) => void;
}

export const HazardRankingChart: React.FC<Props> = ({
  data,
  theme = 'dark',
  height,
  selectedHazard,
  onHazardSelect,
}) => {
  const tokens = useMemo(() => getChartThemeTokens(theme), [theme]);

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter((d) => d.hazard && d.hazard.trim().length > 0)
      .sort((a, b) => a.sif_count - b.sif_count);
  }, [data]);

  const dynamicHeight = height || `${Math.max(260, sortedData.length * 36 + 40)}px`;

  const option: EChartsOption = useMemo(() => {
    if (!sortedData || sortedData.length === 0) {
      return {
        title: {
          text: 'No recurring energy hazard records available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: tokens.textMuted,
            fontSize: 13,
            fontFamily: tokens.fontFamily,
          },
        },
      };
    }

    const hazardNames = sortedData.map((d) => d.hazard);
    const sifCounts = sortedData.map((d) => d.sif_count);

    return {
      backgroundColor: 'transparent',
      animationDuration: 500,
      grid: {
        top: 10,
        right: 45,
        bottom: 20,
        left: 170,
        containLabel: false,
      },
      tooltip: {
        trigger: 'item',
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        shadowBlur: 0,
        formatter: (params: any) => {
          const idx = params.dataIndex;
          const item = sortedData[idx];
          if (!item) return '';

          const rows = [
            {
              label: 'SIF Precursors',
              value: formatCount(item.sif_count),
              color: tokens.sifRed,
              bold: true,
              mono: true,
            },
            {
              label: 'Total Reports',
              value: formatCount(item.total_reports),
              color: tokens.totalVolumeCyan,
              mono: true,
            },
            {
              label: 'Precursor Density',
              value: `${Number(item.sif_density).toFixed(1)}%`,
              color: item.sif_density > 0 ? tokens.warningAmber : tokens.stableTeal,
              bold: true,
              mono: true,
            },
            {
              label: 'Sample Size',
              value: `n=${item.total_reports}`,
              color: tokens.textMuted,
              mono: true,
            },
          ];

          return buildEnterpriseTooltipHtml(
            item.hazard,
            rows,
            tokens,
            'Hazard Precursor Breakdown',
            `${item.sif_count} SIF events out of ${item.total_reports} reports`
          );
        },
      },
      xAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: tokens.splitLineColor,
            type: 'dashed',
          },
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: tokens.textMuted,
          fontSize: 11,
          fontFamily: tokens.fontMono,
        },
      },
      yAxis: {
        type: 'category',
        data: hazardNames,
        axisLine: {
          lineStyle: {
            color: tokens.axisLineColor,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: tokens.textPrimary,
          fontSize: 11,
          fontFamily: tokens.fontFamily,
          formatter: (value: string) => {
            return value.length > 22 ? `${value.slice(0, 20)}…` : value;
          },
        },
      },
      series: [
        {
          name: 'SIF Precursors',
          type: 'bar',
          data: sifCounts,
          barMaxWidth: 18,
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex;
              const item = sortedData[idx];
              if (selectedHazard && item?.hazard === selectedHazard) {
                return tokens.activeOrange;
              }
              return tokens.sifRed;
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            distance: 8,
            formatter: (params: any) => {
              const idx = params.dataIndex;
              const item = sortedData[idx];
              return `${params.value} (${item.total_reports})`;
            },
            color: tokens.textMuted,
            fontSize: 10.5,
            fontFamily: tokens.fontMono,
          },
          emphasis: {
            itemStyle: {
              color: tokens.activeOrange,
            },
          },
        },
      ],
    };
  }, [sortedData, selectedHazard, tokens]);

  const handleEvents = useMemo(() => {
    return {
      click: (params: any) => {
        if (onHazardSelect && params && params.dataIndex !== undefined) {
          const item = sortedData[params.dataIndex];
          if (item?.hazard) {
            onHazardSelect(item.hazard);
          }
        }
      },
    };
  }, [sortedData, onHazardSelect]);

  return (
    <div style={{ width: '100%' }}>
      <EChartWrapper
        option={option}
        style={{ height: dynamicHeight, width: '100%' }}
        theme={theme}
        onEvents={handleEvents}
      />
    </div>
  );
};
