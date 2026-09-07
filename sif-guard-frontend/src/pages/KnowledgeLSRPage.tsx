import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLSRRules, mapTextToLSR } from '../api/lsr';
import { searchKnowledge } from '../api/knowledge';
import type { LSRRead, LSRMatchSchema, KnowledgeItemSchema } from '../types/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { BookOpen, ShieldCheck, Search, Send, Sparkles, CheckCircle2 } from 'lucide-react';

export const KnowledgeLSRPage: React.FC = () => {
  const [rules, setRules] = useState<LSRRead[]>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);
  const [errorRules, setErrorRules] = useState<string | null>(null);

  // Text Mapping Sandbox State
  const [sandboxText, setSandboxText] = useState<string>('Worker entered storage vessel without atmospheric testing and H2S gas check.');
  const [mappingResults, setMappingResults] = useState<LSRMatchSchema[]>([]);
  const [mappingLoading, setMappingLoading] = useState<boolean>(false);

  // Knowledge Search State
  const [searchQuery, setSearchQuery] = useState<string>('Confined space entry testing rules');
  const [searchResults, setSearchResults] = useState<KnowledgeItemSchema[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  useEffect(() => {
    getLSRRules()
      .then((data) => {
        setRules(data);
        setLoadingRules(false);
      })
      .catch((err) => {
        setErrorRules(err.message || 'Failed to load Life-Saving Rules');
        setLoadingRules(false);
      });
  }, []);

  const handleTestMapping = () => {
    if (!sandboxText.trim()) return;
    setMappingLoading(true);
    mapTextToLSR(sandboxText)
      .then((res) => {
        setMappingResults(res);
        setMappingLoading(false);
      })
      .catch(() => {
        setMappingLoading(false);
      });
  };

  const handleKnowledgeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    searchKnowledge(searchQuery)
      .then((res) => {
        setSearchResults(res.results);
        setSearchLoading(false);
      })
      .catch(() => {
        setSearchLoading(false);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          IOGP Life-Saving Rules & HSE Knowledge Base
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Explore canonical 9 IOGP Life-Saving Rules, test interactive text mapping, and search HSE standards
        </p>
      </div>

      {/* Two Column Layout: Interactive Mapping Sandbox & Knowledge Base Search */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* LSR Text Mapping Sandbox */}
        <motion.div className="glass-card" style={{ padding: '24px' }} whileHover={{ y: -2 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-cyan)" /> LSR Semantic Mapping Sandbox
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Enter a raw incident description or observation to test semantic mapping against IOGP Life-Saving Rules.
          </p>

          <textarea
            rows={3}
            value={sandboxText}
            onChange={(e) => setSandboxText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              marginBottom: '12px',
              fontFamily: 'var(--font-main)',
            }}
          />

          <button onClick={handleTestMapping} disabled={mappingLoading} className="btn btn-primary" style={{ marginBottom: '16px' }}>
            <Send size={14} /> {mappingLoading ? 'Mapping Text...' : 'Map to Life-Saving Rules'}
          </button>

          {mappingResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="micro-label">Matched Life-Saving Rules</span>
              {mappingResults.map((m, idx) => (
                <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--accent-primary-bg)', border: '1px solid var(--border-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{m.rule_name}</span>
                  <span className="badge badge-uncertain" style={{ fontSize: '0.7rem' }}>
                    {(m.score * 100).toFixed(0)}% Semantic Match
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Semantic HSE Knowledge Base Search */}
        <motion.div className="glass-card" style={{ padding: '24px' }} whileHover={{ y: -2 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--accent-nonsif-green)" /> Semantic Knowledge Search
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Query SmartQHSE references, investigation methods, and glossary items using dense vector retrieval.
          </p>

          <form onSubmit={handleKnowledgeSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HSE standards, H2S, LOTO..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
            <button type="submit" disabled={searchLoading} className="btn btn-secondary">
              <Search size={14} /> Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.map((k) => (
                <div key={k.id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.875rem' }}>{k.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score: {((k.similarity_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{k.content}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Canonical 9 IOGP Life-Saving Rules Grid */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldCheck size={20} color="var(--accent-cyan)" /> Canonical IOGP 9 Life-Saving Rules Reference
      </h3>

      {errorRules && <ErrorBanner message={errorRules} />}

      {loadingRules ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {rules.map((r, i) => (
            <motion.div
              key={r.id || r.rule_code}
              className="glass-card"
              style={{ padding: '20px' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{r.rule_name}</h4>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                {r.description}
              </p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {r.keywords.map((kw, idx) => (
                  <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
