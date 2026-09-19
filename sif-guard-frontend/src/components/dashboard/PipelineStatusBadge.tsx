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

  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px',
        backgroundColor: 'var(--bg-dark-surface, #0D171A)',
        border: '1px solid var(--border, #203238)',
        borderRadius: '6px',
        fontSize: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Cpu size={14} color="#F2A933" />
        <span style={{ fontWeight: 600, color: '#F4F3EE' }}>HYBRID PIPELINE</span>
      </div>

      <div style={{ height: '12px', width: '1px', backgroundColor: '#203238' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#9CA8AA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>Ingestion & OCR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>Transformer NER</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>Rules Engine</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>Ensemble v1.1.0</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>BGE Vector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>IOGP LSR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4DCEA0' }} />
          <span>HDBSCAN</span>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isHealthy ? (
          <>
            <CheckCircle2 size={13} color="#4DCEA0" />
            <span style={{ color: '#4DCEA0', fontWeight: 600 }}>OPERATIONAL</span>
          </>
        ) : (
          <>
            <AlertCircle size={13} color="#E8AA3D" />
            <span style={{ color: '#E8AA3D', fontWeight: 600 }}>{loading ? 'CHECKING...' : 'ONLINE'}</span>
          </>
        )}
      </div>
    </div>
  );
};
