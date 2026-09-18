import React, { useMemo } from 'react';
import type { EChartsOption } from './echartsCore';
import { EChartWrapper } from './EChartWrapper';
import { getChartThemeTokens } from './echartsTheme';
import { buildEnterpriseTooltipHtml, formatCount } from './chartUtils';
import type { TrendData } from '../../types/api';

interface Props {
  data: TrendData[];
  theme?: 'dark' | 'light';
  height?: string;
  grouping?: 'month' | 'quarter';
  onGroupingChange?: (grouping: 'month' | 'quarter') => void;
  onPointClick?: (point: TrendData) => void;
}

export const TemporalTrendChart: React.FC<Props> = ({
  data,
  theme = 'dark',
  height = '340px',
  grouping = 'month',
  onGroupingChange,
  onPointClick,
}) => {
  const tokens = useMemo(() => getChartThemeTokens(theme), [theme]);

  const option: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No temporal telemetry recorded',
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

    const periods = data.map((d) => d.period);
    const totalReports = data.map((d) => d.total_reports);
    const sifPrecursors = data.map((d) => d.sif_precursors);
    const densities = data.map((d) => d.sif_density);

    return {
      backgroundColor: 'transparent',
      animationDuration: 600,
      grid: {
        top: 45,
        right: 48,
        bottom: data.length > 12 ? 65 : 35,
        left: 55,
        containLabel: true,
      },
      legend: {
        top: 6,
        right: 12,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
        textStyle: {
          color: tokens.textSecondary,
          fontSize: 11,
          fontFamily: tokens.fontFamily,
        },
        data: ['Total Reports', 'SIF Precursors', 'Precursor Density (%)'],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: tokens.crosshairColor,
            width: 1,
            type: 'dashed',
          },
          label: {
            backgroundColor: tokens.isDark ? '#1C1917' : '#E7E5E4',
            color: tokens.textPrimary,
            fontSize: 11,
            fontFamily: tokens.fontMono,
          },
        },
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        shadowBlur: 0,
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const point = data[idx];
          if (!point) return '';

          const rows = [
            {
              label: 'Total Reports',
              value: formatCount(point.total_reports),
              color: tokens.totalVolumeCyan,
              mono: true,
            },
            {
              label: 'SIF Precursors',
              value: formatCount(point.sif_precursors),
              color: tokens.sifRed,
              bold: true,
              mono: true,
            },
            {
              label: 'Precursor Density',
              value: `${point.sif_density.toFixed(1)}%`,
              color: point.sif_density > 0 ? tokens.warningAmber : tokens.stableTeal,
              bold: true,
              mono: true,
            },
            {
              label: 'Sample Size',
              value: `n=${point.total_reports}`,
              color: tokens.textMuted,
              mono: true,
            },
          ];

          return buildEnterpriseTooltipHtml(
            point.period,
            rows,
            tokens,
            undefined,
            `${point.sif_precursors} SIF events across ${point.total_reports} total records`
          );
        },
      },
      xAxis: {
        type: 'category',
        data: periods,
        boundaryGap: true,
        axisLine: {
          lineStyle: {
            color: tokens.axisLineColor,
          },
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: tokens.axisLineColor,
          },
        },
        axisLabel: {
          color: tokens.textMuted,
          fontSize: 11,
          fontFamily: tokens.fontMono,
          interval: 'auto',
          rotate: data.length > 8 ? 25 : 0,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Volume (Reports)',
          nameTextStyle: {
            color: tokens.textMuted,
            fontSize: 10.5,
            fontFamily: tokens.fontFamily,
            padding: [0, 0, 4, 0],
          },
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
        {
          type: 'value',
          name: 'Density (%)',
          nameTextStyle: {
            color: tokens.textMuted,
            fontSize: 10.5,
            fontFamily: tokens.fontFamily,
            padding: [0, 0, 4, 0],
          },
          min: 0,
          max: 100,
          splitLine: {
            show: false,
          },
          axisLine: {
            show: false,
          },
          axisLabel: {
            color: tokens.textMuted,
            fontSize: 11,
            fontFamily: tokens.fontMono,
            formatter: '{value}%',
          },
        },
      ],
      dataZoom:
        data.length > 12
          ? [
              {
                type: 'slider',
                bottom: 6,
                height: 18,
                borderColor: tokens.borderSubtle,
                fillerColor: tokens.isDark
                  ? 'rgba(255, 115, 0, 0.15)'
                  : 'rgba(234, 88, 12, 0.15)',
                textStyle: {
                  color: tokens.textMuted,
                  fontSize: 9.5,
                  fontFamily: tokens.fontMono,
                },
                handleStyle: {
                  color: tokens.activeOrange,
                  borderColor: tokens.activeOrange,
                },
              },
              {
                type: 'inside',
              },
            ]
          : undefined,
      series: [
        {
          name: 'Total Reports',
          type: 'bar',
          yAxisIndex: 0,
          data: totalReports,
          barMaxWidth: 24,
          itemStyle: {
            color: tokens.isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.30)',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: tokens.isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.60)',
            },
          },
        },
        {
          name: 'SIF Precursors',
          type: 'line',
          yAxisIndex: 0,
          data: sifPrecursors,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: true,
          lineStyle: {
            width: 3,
            color: tokens.sifRed,
          },
          itemStyle: {
            color: tokens.sifRed,
            borderColor: tokens.isDark ? '#0B0908' : '#FFFFFF',
            borderWidth: 2,
          },
          emphasis: {
            scale: 1.4,
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(232, 93, 93, 0.5)',
            },
          },
        },
        {
          name: 'Precursor Density (%)',
          type: 'line',
          yAxisIndex: 1,
          data: densities,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: {
            width: 1.5,
            type: 'dashed',
            color: tokens.warningAmber,
          },
          itemStyle: {
            color: tokens.warningAmber,
          },
          emphasis: {
            scale: 1.3,
          },
        },
      ],
    };
  }, [data, tokens]);

  const handleEvents = useMemo(() => {
    return {
      click: (params: any) => {
        if (onPointClick && params && params.dataIndex !== undefined) {
          const point = data[params.dataIndex];
          if (point) onPointClick(point);
        }
      },
    };
  }, [data, onPointClick]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {onGroupingChange && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 8,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => onGroupingChange('month')}
            style={{
              padding: '3px 9px',
              fontSize: '0.72rem',
              fontWeight: grouping === 'month' ? 600 : 500,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              background: grouping === 'month' ? 'var(--primary)' : 'transparent',
              color: grouping === 'month' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease-out',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => onGroupingChange('quarter')}
            style={{
              padding: '3px 9px',
              fontSize: '0.72rem',
              fontWeight: grouping === 'quarter' ? 600 : 500,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              background: grouping === 'quarter' ? 'var(--primary)' : 'transparent',
              color: grouping === 'quarter' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease-out',
            }}
          >
            Quarterly
          </button>
        </div>
      )}

      <EChartWrapper
        option={option}
        style={{ height, width: '100%' }}
        theme={theme}
        onEvents={handleEvents}
      />
    </div>
  );
};
