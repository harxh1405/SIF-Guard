import React, { useMemo } from 'react';
import type { EChartsOption } from './echartsCore';
import { EChartWrapper } from './EChartWrapper';
import { getChartThemeTokens } from './echartsTheme';
import { buildEnterpriseTooltipHtml, formatCount } from './chartUtils';
import type { LSRRanking } from '../../types/api';

interface Props {
  data: LSRRanking[];
  theme?: 'dark' | 'light';
  height?: string;
  selectedLsr?: string | null;
  onLsrSelect?: (ruleName: string) => void;
}

export const LSRDistributionChart: React.FC<Props> = ({
  data,
  theme = 'dark',
  height,
  selectedLsr,
  onLsrSelect,
}) => {
  const tokens = useMemo(() => getChartThemeTokens(theme), [theme]);

  // Sort ascending for bottom-to-top rendering on horizontal bar chart
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter((d) => d.rule_name && d.rule_name.trim().length > 0)
      .sort((a, b) => a.count - b.count);
  }, [data]);

  const dynamicHeight = height || `${Math.max(280, sortedData.length * 36 + 40)}px`;

  const totalMatches = useMemo(() => {
    return sortedData.reduce((acc, curr) => acc + curr.count, 0);
  }, [sortedData]);

  const option: EChartsOption = useMemo(() => {
    if (!sortedData || sortedData.length === 0) {
      return {
        title: {
          text: 'No Life-Saving Rule mappings available',
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

    const ruleNames = sortedData.map((d) => d.rule_name);
    const counts = sortedData.map((d) => d.count);

    return {
      backgroundColor: 'transparent',
      animationDuration: 500,
      grid: {
        top: 10,
        right: 65,
        bottom: 20,
        left: 175,
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
              label: 'Match Count',
              value: formatCount(item.count),
              color: tokens.textPrimary,
              bold: true,
              mono: true,
            },
            {
              label: 'Share of Matches',
              value: `${Number(item.percentage).toFixed(1)}%`,
              color: tokens.warningAmber,
              bold: true,
              mono: true,
            },
            {
              label: 'Total Domain Matches',
              value: formatCount(totalMatches),
              color: tokens.textMuted,
              mono: true,
            },
          ];

          return buildEnterpriseTooltipHtml(
            item.rule_name,
            rows,
            tokens,
            'IOGP Life-Saving Rule Control',
            `${item.count} occurrences across analyzed safety records`
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
        data: ruleNames,
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
          name: 'LSR Matches',
          type: 'bar',
          data: counts,
          barMaxWidth: 18,
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex;
              const item = sortedData[idx];
              if (selectedLsr && item?.rule_name === selectedLsr) {
                return tokens.activeOrange;
              }
              return tokens.isDark ? '#D95B0B' : '#EA580C';
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
              return `${params.value} (${Number(item.percentage).toFixed(1)}%)`;
            },
            color: tokens.textSecondary,
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
  }, [sortedData, selectedLsr, totalMatches, tokens]);

  const handleEvents = useMemo(() => {
    return {
      click: (params: any) => {
        if (onLsrSelect && params && params.dataIndex !== undefined) {
          const item = sortedData[params.dataIndex];
          if (item?.rule_name) {
            onLsrSelect(item.rule_name);
          }
        }
      },
    };
  }, [sortedData, onLsrSelect]);

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
