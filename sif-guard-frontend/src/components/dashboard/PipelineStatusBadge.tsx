import React, { useEffect, useState } from 'react';
import { checkSystemHealth } from '../../api/health';
import type { HealthStatusResponse } from '../../api/health';
import { Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export const PipelineStatusBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    checkSystemHealth()
      .then((data) => {
        if (mounted) {
          setHealth(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const interval = setInterval(() => {
      checkSystemHealth().then((data) => mounted && setHealth(data)).catch(() => {});
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = health?.status === 'ok';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '7px 14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        fontSize: '0.74rem',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Cpu size={14} color="#ff9933" />
        <span style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>
          PIPELINE NODES
        </span>
      </div>

      <div style={{ height: '12px', width: '1px', backgroundColor: 'var(--border)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>OCR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>XGBoost v1.0</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>BGE Vector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>LSR Rules</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>HDBSCAN</span>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isHealthy ? (
          <span
            style={{
              color: '#15803d',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={11} color="#16a34a" />
            <span>OPERATIONAL</span>
          </span>
        ) : (
          <span
            style={{
              color: '#b45309',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.68rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertCircle size={11} color="#b45309" />
            <span>{loading ? 'CHECKING...' : 'ONLINE'}</span>
          </span>
        )}
      </div>
    </div>
  );
};
