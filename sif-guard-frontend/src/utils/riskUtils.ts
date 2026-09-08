import type { RiskLevel } from '../types/facility';

export const RISK_COLORS = {
  CRITICAL: '#FF3B30',
  HIGH: '#FF9500',
  MODERATE: '#FFCC00',
  LOW: '#20D997',
} as const;

export const RISK_HEX_NUMBERS = {
  CRITICAL: 0xff3b30,
  HIGH: 0xff9500,
  MODERATE: 0xffcc00,
  LOW: 0x20d997,
} as const;

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MODERATE';
  return 'LOW';
}

export function getRiskColor(levelOrScore: RiskLevel | number | string | undefined): string {
  if (typeof levelOrScore === 'number') {
    const level = getRiskLevelFromScore(levelOrScore);
    return RISK_COLORS[level];
  }

  switch (levelOrScore?.toUpperCase()) {
    case 'CRITICAL':
    case 'SIF_POTENTIAL':
      return RISK_COLORS.CRITICAL;
    case 'HIGH':
    case 'UNCERTAIN':
      return RISK_COLORS.HIGH;
    case 'MODERATE':
      return RISK_COLORS.MODERATE;
    case 'LOW':
    case 'NON_SIF':
    default:
      return RISK_COLORS.LOW;
  }
}

export function getRiskHexNumber(levelOrScore: RiskLevel | number | string | undefined): number {
  if (typeof levelOrScore === 'number') {
    const level = getRiskLevelFromScore(levelOrScore);
    return RISK_HEX_NUMBERS[level];
  }

  switch (levelOrScore?.toUpperCase()) {
    case 'CRITICAL':
    case 'SIF_POTENTIAL':
      return RISK_HEX_NUMBERS.CRITICAL;
    case 'HIGH':
    case 'UNCERTAIN':
      return RISK_HEX_NUMBERS.HIGH;
    case 'MODERATE':
      return RISK_HEX_NUMBERS.MODERATE;
    case 'LOW':
    case 'NON_SIF':
    default:
      return RISK_HEX_NUMBERS.LOW;
  }
}
