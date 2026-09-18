import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  AlertTriangle,
  Flame,
  ShieldX,
  BookOpen,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type { TabId } from '../layout/Navigation';

interface DataFlowPipelineProps {
  onNavigate?: (tab: TabId) => void;
  theme?: 'dark' | 'light';
  totalReports?: number;
  sifCount?: number;
  activeBarriers?: number;
  lsrMatches?: number;
}

interface PipelineStep {
  id: string;
  stage: string;
  title: string;
  countLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;
  targetTab: TabId;
}

export const DataFlowPipeline: React.FC<DataFlowPipelineProps> = ({
  onNavigate,
  theme = 'dark',
  totalReports = 372,
  sifCount = 85,
  activeBarriers = 7,
  lsrMatches = 5,
}) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const isLight = theme === 'light';

  const steps: PipelineStep[] = [
    {
      id: 'step-1',
      stage: 'STAGE 01',
      title: 'Incident Ingestion',
      countLabel: `${totalReports} Reports`,
      description: 'Multi-source NLP normalization & raw narrative processing',
      icon: FileText,
      color: '#38BDF8',
      targetTab: 'ingestion',
    },
    {
      id: 'step-2',
      stage: 'STAGE 02',
      title: 'Precursor Detection',
      countLabel: `${sifCount} SIF Signals`,
      description: 'Semantic vector clustering & high-energy event classification',
      icon: AlertTriangle,
      color: '#E85D5D',
      targetTab: 'clusters',
    },
    {
      id: 'step-3',
      stage: 'STAGE 03',
      title: 'Hazard & Energy',
      countLabel: '4 Dominant Types',
      description: 'Hydrocarbon, pressure, kinetic & electrical hazard exposure',
      icon: Flame,
      color: '#FFB347',
      targetTab: 'analytics',
    },
    {
      id: 'step-4',
      stage: 'STAGE 04',
      title: 'Barrier Breakdown',
      countLabel: `${activeBarriers} Active Defect Modes`,
      description: 'Physical & administrative control degradation tracking',
      icon: ShieldX,
      color: '#FF7300',
      targetTab: 'analytics',
    },
    {
      id: 'step-5',
      stage: 'STAGE 05',
      title: 'LSR Alignment',
      countLabel: `${lsrMatches} IOGP Rules`,
      description: 'IOGP 9 Life-Saving Rules compliance mapping',
      icon: BookOpen,
      color: '#20D997',
      targetTab: 'knowledge',
    },
    {
      id: 'step-6',
      stage: 'STAGE 06',
      title: 'Actionable Triage',
      countLabel: 'Human-in-the-Loop',
      description: 'Superintendent verification & corrective workflow dispatch',
      icon: UserCheck,
      color: '#A855F7',
      targetTab: 'review',
    },
  ];

  return (
    <div
      style={{
        background: isLight ? 'var(--surface-elevated, #FFFFFF)' : 'var(--surface, #0B0908)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--primary)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 115, 0, 0.1)',
                border: '1px solid rgba(255, 115, 0, 0.2)',
              }}
            >
              PIPELINE ARCHITECTURE
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Safety Intelligence Transformation Pipeline
            </h3>
          </div>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            Trace unstructured field logs through AI classification, barrier defect correlation, to operational triage
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success, #20D997)',
              boxShadow: '0 0 8px rgba(32, 217, 151, 0.6)',
            }}
          />
          <span>Continuous Processing Active</span>
        </div>
      </div>

      {/* Interactive Horizontal Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          position: 'relative',
        }}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isHovered = activeStep === idx;

          return (
            <motion.div
              key={step.id}
              onMouseEnter={() => setActiveStep(idx)}
              onMouseLeave={() => setActiveStep(null)}
              onClick={() => onNavigate && onNavigate(step.targetTab)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                padding: '16px 14px',
                borderRadius: '12px',
                background: isHovered
                  ? isLight
                    ? '#F8FAFC'
                    : 'rgba(255, 255, 255, 0.04)'
                  : isLight
                    ? '#FFFFFF'
                    : 'var(--surface-elevated, #12100E)',
                border: `1px solid ${isHovered ? step.color : 'var(--border-subtle)'}`,
                cursor: onNavigate ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative',
                transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isHovered ? `0 4px 16px ${step.color}20` : 'none',
              }}
            >
              {/* Top Row: Stage Tag & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: step.color,
                    letterSpacing: '0.06em',
                  }}
                >
                  {step.stage}
                </span>

                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                  }}
                >
                  <Icon size={14} />
                </div>
              </div>

              {/* Step Title & Metric Tag */}
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-main)',
                  }}
                >
                  {step.title}
                </h4>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: step.color,
                    fontFamily: 'var(--font-mono)',
                    display: 'inline-block',
                    marginTop: '2px',
                  }}
                >
                  {step.countLabel}
                </span>
              </div>

              {/* Step Description */}
              <p
                style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  flex: 1,
                }}
              >
                {step.description}
              </p>

              {/* Action Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: isHovered ? step.color : 'var(--text-muted)',
                  marginTop: '4px',
                  transition: 'color 0.15s ease',
                }}
              >
                <span>Inspect</span>
                <ChevronRight size={12} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
