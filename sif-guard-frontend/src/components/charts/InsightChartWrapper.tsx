import React, { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader2, AlertCircle, BarChart2 } from 'lucide-react';

export interface InsightChartWrapperProps {
  title?: string;
  subtitle?: string;
  option: any;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onChartClick?: (params: any) => void;
  headerAction?: React.ReactNode;
}

export const SIF_GUARD_ECHARTS_THEME = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#64748b',
  },
  title: {
    textStyle: {
      color: '#003366',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
    },
  },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2 },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true,
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: '#e2e8f0', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: '#0f172a', fontSize: 12 },
    extraCssText: 'box-shadow: 0 8px 24px rgba(0, 51, 102, 0.12); border-radius: 6px;',
  },
};

export const InsightChartWrapper: React.FC<InsightChartWrapperProps> = ({
  title,
  subtitle,
  option,
  height = 320,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No safety signals found for this period. Try expanding the date range.',
  onChartClick,
  headerAction,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance && onChartClick) {
      chartInstance.off('click');
      chartInstance.on('click', onChartClick);
    }
  }, [onChartClick, option]);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 'none',
      }}
    >
      {(title || subtitle || headerAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
            gap: '12px',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  margin: '3px 0 0 0',
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', height }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(13, 23, 26, 0.85)',
              zIndex: 10,
              gap: '10px',
              color: 'var(--text-secondary, #9CA8AA)',
              fontSize: '0.85rem',
            }}
          >
            <Loader2 size={24} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--amber, #F2A933)' }} />
            <span>Analyzing safety signals...</span>
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(13, 23, 26, 0.95)',
              zIndex: 10,
              padding: '20px',
              textAlign: 'center',
              color: 'var(--critical-red, #E54F4F)',
              gap: '8px',
            }}
          >
            <AlertCircle size={24} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Visualization temporary unavailable</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA8AA)' }}>{error}</span>
          </div>
        )}

        {!loading && !error && empty && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary, #9CA8AA)',
              gap: '8px',
            }}
          >
            <BarChart2 size={32} opacity={0.4} />
            <span style={{ fontSize: '0.85rem' }}>{emptyMessage}</span>
          </div>
        )}

        {!loading && !error && !empty && (
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ width: '100%', height: '100%' }}
            theme={SIF_GUARD_ECHARTS_THEME}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>
    </div>
  );
};
