export interface SIFChartThemeTokens {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  fontFamily: string;
  fontMono: string;
  fontDisplay: string;
  // Semantic Colors
  sifRed: string;
  sifRedSoft: string;
  sifRedBorder: string;
  totalVolumeCyan: string;
  totalVolumeFill: string;
  activeOrange: string;
  warningAmber: string;
  stableTeal: string;
  neutralSlate: string;
  gridLineColor: string;
  splitLineColor: string;
  axisLineColor: string;
  crosshairColor: string;
}

export function getChartThemeTokens(theme: 'dark' | 'light' = 'dark'): SIFChartThemeTokens {
  const isDark = theme === 'dark';

  if (isDark) {
    return {
      isDark: true,
      background: 'transparent',
      surface: '#0B0908',
      surfaceElevated: '#12100E',
      border: 'rgba(255, 255, 255, 0.08)',
      borderSubtle: 'rgba(255, 255, 255, 0.05)',
      textPrimary: '#F5F1EA',
      textSecondary: '#A8A099',
      textMuted: '#716B64',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontMono: "'JetBrains Mono', monospace",
      fontDisplay: "'Space Grotesk', Inter, system-ui, sans-serif",
      // Semantic Colors
      sifRed: '#E85D5D',
      sifRedSoft: 'rgba(232, 93, 93, 0.25)',
      sifRedBorder: 'rgba(232, 93, 93, 0.45)',
      totalVolumeCyan: '#38BDF8',
      totalVolumeFill: 'rgba(56, 189, 248, 0.12)',
      activeOrange: '#FF7300',
      warningAmber: '#FFB347',
      stableTeal: '#20D997',
      neutralSlate: '#64748B',
      gridLineColor: 'rgba(255, 255, 255, 0.05)',
      splitLineColor: 'rgba(255, 255, 255, 0.04)',
      axisLineColor: 'rgba(255, 255, 255, 0.12)',
      crosshairColor: 'rgba(255, 115, 0, 0.4)',
    };
  }

  return {
    isDark: false,
    background: 'transparent',
    surface: '#FAF8F5',
    surfaceElevated: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.08)',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textMuted: '#A8A29E',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontMono: "'JetBrains Mono', monospace",
    fontDisplay: "'Space Grotesk', Inter, system-ui, sans-serif",
    // Semantic Colors
    sifRed: '#DC2626',
    sifRedSoft: 'rgba(220, 38, 38, 0.15)',
    sifRedBorder: 'rgba(220, 38, 38, 0.35)',
    totalVolumeCyan: '#0284C7',
    totalVolumeFill: 'rgba(2, 132, 199, 0.10)',
    activeOrange: '#EA580C',
    warningAmber: '#D97706',
    stableTeal: '#059669',
    neutralSlate: '#64748B',
    gridLineColor: 'rgba(0, 0, 0, 0.05)',
    splitLineColor: 'rgba(0, 0, 0, 0.04)',
    axisLineColor: 'rgba(0, 0, 0, 0.15)',
    crosshairColor: 'rgba(234, 88, 12, 0.4)',
  };
}
