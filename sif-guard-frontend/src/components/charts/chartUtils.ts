import type { SIFChartThemeTokens } from './echartsTheme';

export interface TooltipRow {
  label: string;
  value: string | number;
  color?: string;
  bold?: boolean;
  mono?: boolean;
}

/**
 * Builds a clean, professional, enterprise-grade tooltip string for ECharts.
 * Strictly adheres to enterprise guidelines: NO neon, NO heavy glassmorphism, NO decorative blur.
 */
export function buildEnterpriseTooltipHtml(
  title: string,
  rows: TooltipRow[],
  tokens: SIFChartThemeTokens,
  subtitle?: string,
  footnote?: string
): string {
  const bg = tokens.isDark ? '#0D0F10' : '#FFFFFF';
  const border = tokens.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const shadow = tokens.isDark
    ? '0 6px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)'
    : '0 6px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)';

  let html = `
    <div style="
      background-color: ${bg};
      border: 1px solid ${border};
      border-radius: 8px;
      padding: 10px 14px;
      box-shadow: ${shadow};
      font-family: ${tokens.fontFamily};
      min-width: 190px;
      max-width: 280px;
      line-height: 1.4;
      color: ${tokens.textPrimary};
    ">
      <div style="
        font-size: 12px;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin-bottom: ${subtitle ? '2px' : '8px'};
        border-bottom: 1px solid ${tokens.borderSubtle};
        padding-bottom: 6px;
        color: ${tokens.textPrimary};
      ">
        ${title}
      </div>
  `;

  if (subtitle) {
    html += `
      <div style="
        font-size: 10.5px;
        color: ${tokens.textMuted};
        margin-bottom: 8px;
        border-bottom: 1px solid ${tokens.borderSubtle};
        padding-bottom: 6px;
      ">
        ${subtitle}
      </div>
    `;
  }

  html += `<div style="display: flex; flex-direction: column; gap: 4px;">`;

  rows.forEach((row) => {
    const valColor = row.color || tokens.textPrimary;
    const fontFam = row.mono ? tokens.fontMono : tokens.fontFamily;
    const fontWt = row.bold ? '600' : '500';

    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
        <span style="color: ${tokens.textSecondary};">${row.label}</span>
        <span style="color: ${valColor}; font-family: ${fontFam}; font-weight: ${fontWt}; margin-left: 14px;">
          ${row.value}
        </span>
      </div>
    `;
  });

  html += `</div>`;

  if (footnote) {
    html += `
      <div style="
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px dashed ${tokens.borderSubtle};
        font-size: 10px;
        color: ${tokens.textMuted};
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        ${footnote}
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Formats numbers cleanly with commas
 */
export function formatCount(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Formats a percentage with sample context
 */
export function formatPercentageWithContext(
  numerator: number,
  denominator: number,
  decimals: number = 1
): { percentStr: string; contextStr: string; fullStr: string } {
  if (!denominator || denominator <= 0) {
    return {
      percentStr: '0.0%',
      contextStr: `0 / 0 reports`,
      fullStr: `0.0% (0 / 0 reports)`,
    };
  }

  const pct = (numerator / denominator) * 100;
  const pctFormatted = pct.toFixed(decimals) + '%';
  const ctx = `${numerator} / ${denominator} reports`;

  return {
    percentStr: pctFormatted,
    contextStr: ctx,
    fullStr: `${pctFormatted} (${ctx})`,
  };
}
