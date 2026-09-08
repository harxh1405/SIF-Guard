import React, { useState, useEffect } from 'react';
import type { DemoScenario, DemoSimulationResponse } from '../../types/facility';
import { getDemoScenarios, simulateDemoIncident } from '../../api/facility';
import { X, Zap, Play, RefreshCw } from 'lucide-react';

interface DemoSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated: (res: DemoSimulationResponse) => void;
}

export const DemoSimulationModal: React.FC<DemoSimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
}) => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getDemoScenarios()
        .then((res) => {
          setScenarios(res);
          if (res.length > 0) {
            setSelectedScenarioId(res[0].id);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch demo scenarios');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = customText.trim()
        ? { custom_text: customText, severity: 'CRITICAL' }
        : { scenario_id: selectedScenarioId };

      const res = await simulateDemoIncident(payload);
      onSimulated(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '640px',
          maxWidth: '100%',
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 106, 0, 0.15)',
                border: '1px solid rgba(255, 106, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live Incident Simulation Engine
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Inject realistic field near-miss telemetry to observe real-time SIF classification & zone risk escalation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FF3B3018', border: '1px solid #FF3B3044', color: '#FF3B30', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {/* Scenario Selection */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Select Industrial Scenario Preset:
          </label>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setCustomText('');
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                [{sc.zone_name}] {sc.title} ({sc.severity})
              </option>
            ))}
          </select>
        </div>

        {/* Scenario Preview */}
        {selectedScenario && !customText && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                {selectedScenario.zone_name} Target Zone
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#FF3B3022',
                  color: '#FF3B30',
                }}
              >
                {selectedScenario.severity}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              {selectedScenario.simulated_text}
            </p>
          </div>
        )}

        {/* Custom Text Input */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Or Write Custom Operational Observation:
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. Flare line bypass valve opened during compressor maintenance without atmospheric gas test..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-main)',
            }}
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSimulate}
            disabled={isSubmitting}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Classifying & Escalating...
              </>
            ) : (
              <>
                <Play size={14} /> Inject Simulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
