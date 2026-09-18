import React, { useEffect, useRef } from 'react';
import echarts from './echartsCore';
import type { EChartsType, EChartsOption } from './echartsCore';

export interface EChartWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  theme?: 'dark' | 'light';
  onEvents?: Record<string, (params: any, instance: EChartsType) => void>;
  onChartReady?: (instance: EChartsType) => void;
}

export const EChartWrapper: React.FC<EChartWrapperProps> = ({
  option,
  style = { height: '320px', width: '100%' },
  className = '',
  loading = false,
  theme,
  onEvents,
  onChartReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsType | null>(null);

  // Initialize and update chart instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Check DOM attribute if theme prop is not explicitly passed
    const activeTheme =
      theme ||
      (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ||
      'dark';

    if (!chartInstanceRef.current) {
      const chart = echarts.init(containerRef.current, activeTheme, {
        renderer: 'canvas',
      });
      chartInstanceRef.current = chart;

      if (onChartReady) {
        onChartReady(chart);
      }
    }

    const chartInstance = chartInstanceRef.current;

    // Bind event handlers
    if (onEvents && chartInstance) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chartInstance.off(eventName);
        chartInstance.on(eventName, (params: any) => {
          handler(params, chartInstance);
        });
      });
    }

    // Set chart options
    if (chartInstance && option) {
      chartInstance.setOption(option, {
        notMerge: true,
        lazyUpdate: false,
      });
    }

    // Handle loading indicator
    if (chartInstance) {
      if (loading) {
        chartInstance.showLoading({
          text: 'Loading telemetry...',
          color: '#FF7300',
          textColor: activeTheme === 'dark' ? '#F5F1EA' : '#1C1917',
          maskColor: activeTheme === 'dark' ? 'rgba(11, 9, 8, 0.7)' : 'rgba(250, 248, 245, 0.7)',
        });
      } else {
        chartInstance.hideLoading();
      }
    }
  }, [option, theme, loading, onEvents, onChartReady]);

  // ResizeObserver for robust responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.resize({
            animation: {
              duration: 200,
            },
          });
        }
      }, 50);
    });

    observer.observe(containerRef.current);

    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, []);

  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        minHeight: '120px',
        ...style,
      }}
    />
  );
};
