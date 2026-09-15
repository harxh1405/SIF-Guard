import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, SYNTHETIC_DEMO_USERS } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Flame,
  Radar,
  Database,
  Key,
  BookOpen,
  Info,
  X,
  UserCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, loginAsDemoRole, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSelect = (roleKey: string) => {
    const demoUser = SYNTHETIC_DEMO_USERS[roleKey];
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword(demoUser.passwordHint);
      loginAsDemoRole(roleKey);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top Brand Header */}
      <header
        style={{
          padding: '18px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(255, 106, 0, 0.3)',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-display)',
                }}
              >
                SIF-GUARD
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 106, 0, 0.12)',
                  color: 'var(--primary-bright)',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 106, 0, 0.25)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                OIL INDIA LIMITED
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              AI & NLP Serious Injury & Fatality Precursor Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCheatsheet(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Key size={15} color="var(--primary)" />
          <span>Synthetic User Credentials</span>
        </button>
      </header>

      {/* Main Hero & Auth Split View */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          padding: '48px 40px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(420px, 0.95fr)',
          gap: '50px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Platform Pitch & Capabilities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 106, 0, 0.10)',
              border: '1px solid rgba(255, 106, 0, 0.25)',
              color: 'var(--primary-bright)',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              width: 'fit-content',
            }}
          >
            <Sparkles size={14} />
            <span>ENTERPRISE SAFETY AI PLATFORM</span>
          </div>

          <h1
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Transform Safety Logs Into <span className="text-gradient">Precursor Intelligence</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            SIF-Guard enforces the critical principle: <strong>Actual Outcome ≠ Potential Outcome</strong>. Built for Oil India Limited to analyze near-misses, unsafe acts, and observations across drilling rigs and production facilities.
          </p>

          {/* Key Feature Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldAlert size={20} color="var(--danger)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>XGBoost SIF Classifier</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Combines 16 domain rules with BGE dense embeddings for explainable SIF scoring.
              </p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <BookOpen size={20} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>IOGP LSR Alignment</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Automatic mapping against canonical 9 Life-Saving Rules using vector search.
              </p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Radar size={20} color="var(--success)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>3D WebGL Digital Twin</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Interactive spatial refinery model with real-time risk zone telemetry.
              </p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Database size={20} color="var(--warning)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>10 NLP Attributes</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Extracts barrier failure, energy source, hazard, equipment, and exposure.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Supabase Login Form Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          className="glass-panel"
          style={{
            padding: '36px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px 0' }}>
              Supabase Authentication
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Enter your Oil India Limited corporate credentials or use quick demo role login.
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(232, 93, 93, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                Corporate Email / User ID
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@oilindia.in"
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="micro-label" style={{ display: 'block', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <span>Authenticating with Supabase...</span>
              ) : (
                <>
                  <span>Sign In to SIF-Guard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Picker Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0 16px 0',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
              1-Click Demo Login Roles
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Quick Demo Role Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(SYNTHETIC_DEMO_USERS).map(([roleKey, u]) => (
              <button
                key={roleKey}
                onClick={() => handleQuickDemoSelect(roleKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{u.avatar_badge.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.title} • {u.department}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 106, 0, 0.10)',
                    color: 'var(--primary-bright)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {u.role.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Synthetic User Credentials Drawer Modal */}
      <AnimatePresence>
        {showCheatsheet && (
          <div
            className="modal-backdrop"
            onClick={() => setShowCheatsheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '780px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: 'var(--shadow-modal)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={22} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                    Synthetic Supabase User Dataset & Credentials
                  </h3>
                </div>
                <button
                  onClick={() => setShowCheatsheet(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Below are the synthetic credentials configured for Oil India Limited. You can also paste <code style={{ color: 'var(--primary-bright)' }}>supabase_seed.sql</code> into your Supabase Dashboard SQL Editor to initialize these profiles in your database.
              </p>

              {/* Accounts Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-elevated)', textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px' }}>Role</th>
                      <th style={{ padding: '10px 14px' }}>Name</th>
                      <th style={{ padding: '10px 14px' }}>User Email</th>
                      <th style={{ padding: '10px 14px' }}>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(SYNTHETIC_DEMO_USERS).map(([key, u]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary-bright)', fontFamily: 'var(--font-mono)' }}>
                          {u.role.toUpperCase()}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{u.full_name}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{u.email}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{u.passwordHint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCheatsheet(false)} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  Close Credentials
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
