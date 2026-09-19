import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Handle,
  Position,
} from '@xyflow/react';
import type { NodeProps, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FingerprintSchema } from '../../types/api';
import { ShieldAlert, ArrowRight, ArrowDown, Activity, Flame, AlertTriangle, Layers, Network, LayoutList } from 'lucide-react';

interface SafetyFingerprintProps {
  fingerprint?: FingerprintSchema | null;
  onNodeClick?: (type: string, value: string) => void;
  height?: number | string;
}

// Custom Node component with clear aesthetic for ReactFlow
const CustomFingerprintNode: React.FC<NodeProps> = ({ data }) => {
  const isBarrier = data.type === 'FAILED BARRIER';
  const isConsequence = data.type === 'POTENTIAL CONSEQUENCE';
  const isLsr = data.type === 'LIFE-SAVING RULE';

  const borderColor = isBarrier
    ? 'var(--danger)'
    : isConsequence
    ? 'var(--warning)'
    : isLsr
    ? 'var(--warning)'
    : 'var(--success)';

  const bgColor = isBarrier
    ? 'rgba(220, 38, 38, 0.08)'
    : isConsequence
    ? 'rgba(217, 119, 6, 0.08)'
    : isLsr
    ? 'rgba(217, 119, 6, 0.08)'
    : 'var(--surface-elevated)';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: '10px 14px',
        minWidth: '180px',
        color: 'var(--text-primary)',
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)`,
        fontFamily: 'var(--font-sans, sans-serif)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.62rem',
          fontWeight: 700,
          color: borderColor,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {String(data.type)}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.2 }}>
        {String(data.label)}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
};

const nodeTypes = {
  fingerprintNode: CustomFingerprintNode,
};

export const SafetyFingerprint: React.FC<SafetyFingerprintProps> = ({
  fingerprint,
  onNodeClick,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'dag'>('card');

  const activity = fingerprint?.activity || 'Activity Unspecified';
  const hazard = fingerprint?.hazard || 'Hazard Unspecified';
  const exposure = fingerprint?.exposure || 'Exposure Unspecified';
  const barrierFailure = fingerprint?.barrier_failure || fingerprint?.barrier || 'No Barrier Failure Detected';
  const consequence = fingerprint?.potential_consequence || 'Unspecified Potential Consequence';
  const lsrRules = fingerprint?.life_saving_rules || [];

  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = [
      {
        id: 'node-act',
        type: 'fingerprintNode',
        position: { x: 20, y: 30 },
        data: { type: 'ACTIVITY', label: activity },
      },
      {
        id: 'node-haz',
        type: 'fingerprintNode',
        position: { x: 230, y: 30 },
        data: { type: 'HAZARD', label: hazard },
      },
      {
        id: 'node-exp',
        type: 'fingerprintNode',
        position: { x: 440, y: 30 },
        data: { type: 'EXPOSURE', label: exposure },
      },
      {
        id: 'node-bar',
        type: 'fingerprintNode',
        position: { x: 650, y: 30 },
        data: { type: 'FAILED BARRIER', label: barrierFailure },
      },
      {
        id: 'node-con',
        type: 'fingerprintNode',
        position: { x: 860, y: 30 },
        data: { type: 'POTENTIAL CONSEQUENCE', label: consequence },
      },
    ];

    if (lsrRules.length > 0) {
      rawNodes.push({
        id: 'node-lsr',
        type: 'fingerprintNode',
        position: { x: 650, y: 160 },
        data: { type: 'LIFE-SAVING RULE', label: lsrRules.join(', ') },
      });
    }

    const rawEdges: Edge[] = [
      { id: 'e-1', source: 'node-act', target: 'node-haz', animated: true, style: { stroke: '#4DCEA0' } },
      { id: 'e-2', source: 'node-haz', target: 'node-exp', animated: true, style: { stroke: '#4DCEA0' } },
      { id: 'e-3', source: 'node-exp', target: 'node-bar', animated: true, style: { stroke: '#E54F4F' } },
      { id: 'e-4', source: 'node-bar', target: 'node-con', animated: true, style: { stroke: '#E8AA3D' } },
    ];

    if (lsrRules.length > 0) {
      rawEdges.push({
        id: 'e-lsr',
        source: 'node-bar',
        target: 'node-lsr',
        animated: false,
        style: { stroke: '#F2A933', strokeDasharray: '5,5' },
      });
    }

    return { nodes: rawNodes, edges: rawEdges };
  }, [activity, hazard, exposure, barrierFailure, consequence, lsrRules]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (onNodeClick && node.data) {
      onNodeClick(String(node.data.type), String(node.data.label));
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #0D171A)',
        border: '1px solid var(--border, #203238)',
        borderRadius: '8px',
        padding: '20px',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header with View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={20} color="var(--warning)" />
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-display, var(--font-sans))',
                fontSize: '1.05rem',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              SAFETY FINGERPRINT
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Deterministic Precursor Incident Sequence & Barrier Failure Flow
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--background-secondary)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('card')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: viewMode === 'card' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'card' ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <LayoutList size={13} /> Flow Summary
          </button>
          <button
            onClick={() => setViewMode('dag')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: viewMode === 'dag' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'dag' ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Network size={13} /> Interactive DAG
          </button>
        </div>
      </div>

      {/* Mode 1: Executive Safety Fingerprint Flow Card */}
      {viewMode === 'card' && (() => {
        const isNoBarrierFailure =
          !barrierFailure ||
          barrierFailure.toLowerCase().includes('no barrier failure') ||
          barrierFailure.toLowerCase() === 'none' ||
          barrierFailure.toLowerCase() === 'none identified' ||
          barrierFailure.toLowerCase() === 'unspecified';

        const isUncertainBarrier = barrierFailure.toLowerCase().includes('uncertain');

        const barrierColor = isNoBarrierFailure
          ? 'var(--success)'
          : isUncertainBarrier
          ? 'var(--warning)'
          : 'var(--danger)';

        const barrierBg = isNoBarrierFailure
          ? 'rgba(5, 150, 105, 0.08)'
          : isUncertainBarrier
          ? 'rgba(217, 119, 6, 0.08)'
          : 'rgba(220, 38, 38, 0.08)';

        const barrierBadgeText = isNoBarrierFailure
          ? 'NO DEFECT DETECTED'
          : isUncertainBarrier
          ? 'BARRIER UNCERTAIN'
          : 'CRITICAL DEFECT';

        const primaryLsrText = lsrRules.length > 0 ? lsrRules[0] : 'No relevant Life-Saving Rule detected';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Triplet Row: Activity -> Hazard -> Exposure */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Activity size={12} /> Activity / Task
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activity}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)' }}>
                <ArrowRight size={18} />
              </div>

              <div style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Flame size={12} /> Hazard
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{hazard}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)' }}>
                <ArrowRight size={18} />
              </div>

              <div style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Exposure Mode
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{exposure}</div>
              </div>
            </div>

            {/* Vertical Linkage Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', color: barrierColor, margin: '-4px 0' }}>
              <ArrowDown size={20} />
            </div>

            {/* Highlighted Failed Barrier Alert Box */}
            <div
              style={{
                backgroundColor: barrierBg,
                border: `1px solid ${barrierColor}`,
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: barrierColor, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> BARRIER STATUS
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {barrierFailure}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: barrierColor, fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: 'rgba(220, 38, 38, 0.12)', padding: '4px 10px', borderRadius: '4px' }}>
                {barrierBadgeText}
              </div>
            </div>

            {/* Vertical Linkage Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--warning)', margin: '-4px 0' }}>
              <ArrowDown size={20} />
            </div>

            {/* Bottom Dual Card: Consequence & Primary LSR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Potential Consequence
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{consequence}</div>
              </div>

              <div style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Layers size={12} /> Primary LSR Rule
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: lsrRules.length > 0 ? 'var(--warning)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {primaryLsrText}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mode 2: Interactive ReactFlow Canvas */}
      {viewMode === 'dag' && (
        <div style={{ width: '100%', height: '320px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="var(--border)" gap={16} size={1} />
            <Controls style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
};
