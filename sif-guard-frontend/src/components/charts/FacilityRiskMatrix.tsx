import React, { useMemo } from 'react';
import type { EChartsOption } from './echartsCore';
import { EChartWrapper } from './EChartWrapper';
import { getChartThemeTokens } from './echartsTheme';
import { buildEnterpriseTooltipHtml, formatCount } from './chartUtils';
import type { SiteRanking } from '../../types/api';

interface Props {
  data: SiteRanking[];
  theme?: 'dark' | 'light';
  height?: string;
  selectedFacility?: string | null;
  onFacilitySelect?: (site: string) => void;
}

export const FacilityRiskMatrix: React.FC<Props> = ({
  data,
  theme = 'dark',
  height = '380px',
  selectedFacility,
  onFacilitySelect,
}) => {
  const tokens = useMemo(() => getChartThemeTokens(theme), [theme]);

  const option: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No facility records available',
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

    // Prepare scatter data: [total_reports, sif_density, sif_count, site_name, raw_item]
    const scatterData = data.map((item) => {
      return [
        item.total_reports,
        item.sif_density,
        item.sif_count,
        item.site,
        item,
      ];
    });

    const maxReports = Math.max(...data.map((d) => d.total_reports), 10);
    const maxSifCount = Math.max(...data.map((d) => d.sif_count), 1);

    return {
      backgroundColor: 'transparent',
      animationDuration: 600,
      grid: {
        top: 35,
        right: 35,
        bottom: 45,
        left: 55,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
        shadowBlur: 0,
        formatter: (params: any) => {
          const itemData = params.data;
          if (!itemData) return '';
          const [reports, density, sifCount, siteName] = itemData;

          const isSmallSample = reports < 5;
          const rows = [
            {
              label: 'Total Reports',
              value: formatCount(reports),
              color: tokens.totalVolumeCyan,
              mono: true,
            },
            {
              label: 'SIF Precursors',
              value: formatCount(sifCount),
              color: tokens.sifRed,
              bold: true,
              mono: true,
            },
            {
              label: 'Precursor Density',
              value: `${Number(density).toFixed(1)}%`,
              color: density > 0 ? tokens.warningAmber : tokens.stableTeal,
              bold: true,
              mono: true,
            },
            {
              label: 'Sample Size',
              value: `n=${reports}`,
              color: tokens.textMuted,
              mono: true,
            },
          ];

          const footnote = isSmallSample
            ? `Limited sample (${reports} ${reports === 1 ? 'event' : 'events'}) • Density sensitive to single events`
            : `${sifCount} SIF events across ${reports} total reports`;

          return buildEnterpriseTooltipHtml(
            siteName || 'Facility Location',
            rows,
            tokens,
            undefined,
            footnote
          );
        },
      },
      xAxis: {
        type: 'value',
        name: 'Report Volume (Total Records)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: {
          color: tokens.textSecondary,
          fontSize: 11,
          fontFamily: tokens.fontFamily,
        },
        splitLine: {
          lineStyle: {
            color: tokens.splitLineColor,
            type: 'dashed',
          },
        },
        axisLine: {
          lineStyle: {
            color: tokens.axisLineColor,
          },
        },
        axisLabel: {
          color: tokens.textMuted,
          fontSize: 11,
          fontFamily: tokens.fontMono,
        },
        min: 0,
        max: Math.ceil(maxReports * 1.15),
      },
      yAxis: {
        type: 'value',
        name: 'SIF Precursor Density (%)',
        nameLocation: 'middle',
        nameGap: 38,
        nameTextStyle: {
          color: tokens.textSecondary,
          fontSize: 11,
          fontFamily: tokens.fontFamily,
        },
        min: 0,
        max: 100,
        splitLine: {
          lineStyle: {
            color: tokens.splitLineColor,
            type: 'dashed',
          },
        },
        axisLine: {
          lineStyle: {
            color: tokens.axisLineColor,
          },
        },
        axisLabel: {
          color: tokens.textMuted,
          fontSize: 11,
          fontFamily: tokens.fontMono,
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: 'Facilities',
          type: 'scatter',
          data: scatterData,
          symbolSize: (val: any) => {
            const sifCount = val[2] || 0;
            // Size mapping based on SIF count: min 14px, max 42px
            const normalized = Math.sqrt(sifCount) / Math.sqrt(maxSifCount || 1);
            return Math.max(14, Math.min(42, Math.round(14 + normalized * 26)));
          },
          itemStyle: {
            color: (params: any) => {
              const itemData = params.data;
              if (!itemData) return tokens.sifRed;
              const siteName = itemData[3];
              const sifCount = itemData[2];

              if (selectedFacility && siteName === selectedFacility) {
                return tokens.activeOrange;
              }

              if (sifCount > 0) {
                return tokens.isDark ? 'rgba(232, 93, 93, 0.75)' : 'rgba(220, 38, 38, 0.75)';
              }
              return tokens.isDark ? 'rgba(32, 217, 151, 0.65)' : 'rgba(5, 150, 105, 0.65)';
            },
            borderColor: (params: any) => {
              const itemData = params.data;
              if (!itemData) return tokens.sifRed;
              const siteName = itemData[3];
              if (selectedFacility && siteName === selectedFacility) {
                return '#FFFFFF';
              }
              return tokens.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            },
            borderWidth: 1.5,
          },
          emphasis: {
            focus: 'self',
            itemStyle: {
              borderColor: tokens.activeOrange,
              borderWidth: 2.5,
              shadowBlur: 10,
              shadowColor: 'rgba(255, 115, 0, 0.4)',
            },
          },
          label: {
            show: true,
            position: 'top',
            distance: 6,
            formatter: (params: any) => {
              const siteName = params.data[3] || '';
              // Truncate long site labels in the scatter plot
              return siteName.length > 18 ? `${siteName.slice(0, 16)}…` : siteName;
            },
            color: tokens.textSecondary,
            fontSize: 10,
            fontFamily: tokens.fontFamily,
          },
        },
      ],
    };
  }, [data, selectedFacility, tokens]);

  const handleEvents = useMemo(() => {
    return {
      click: (params: any) => {
        if (onFacilitySelect && params && params.data) {
          const siteName = params.data[3];
          if (siteName) {
            onFacilitySelect(siteName);
          }
        }
      },
    };
  }, [onFacilitySelect]);

  return (
    <div style={{ width: '100%' }}>
      <EChartWrapper
        option={option}
        style={{ height, width: '100%' }}
        theme={theme}
        onEvents={handleEvents}
      />
    </div>
  );
};
