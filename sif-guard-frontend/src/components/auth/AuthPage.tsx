import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2, Lock, Mail, User, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  const getFriendlyErrorMessage = (errMsg: string): string => {
    const lower = errMsg.toLowerCase();
    if (lower.includes('email signups are disabled') || lower.includes('signups are disabled')) {
      return 'Email signups are currently disabled in your Supabase project settings. Please enable "Email" provider in the Supabase Dashboard (Authentication > Providers > Email).';
    }
    if (lower.includes('email logins are disabled') || lower.includes('logins are disabled')) {
      return 'Email logins are currently disabled in your Supabase project settings. Please enable "Email" provider in the Supabase Dashboard (Authentication > Providers > Email).';
    }
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'An account with this email address already exists. Please log in instead.';
    }
    if (lower.includes('password should be at least')) {
      return 'Password must be at least 6 characters in length.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network error')) {
      return 'Unable to reach authentication server. Please check your internet connection.';
    }
    return errMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    // Validation
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        setError('Please enter your full name.');
        return;
      }

      setLoading(true);
      const { error: signUpError } = await signUp(trimmedEmail, password, trimmedName);
      setLoading(false);

      if (signUpError) {
        setError(getFriendlyErrorMessage(signUpError.message));
      } else {
        setSuccessMessage('Account created successfully! You can now log in.');
        setMode('login');
        setPassword('');
      }
    } else {
      setLoading(true);
      const { error: signInError } = await signIn(trimmedEmail, password);
      setLoading(false);

      if (signInError) {
        setError(getFriendlyErrorMessage(signInError.message));
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #0B0806)',
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(255, 106, 0, 0.08) 0%, transparent 70%)',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card, #17110D)',
          border: '1px solid var(--border-color, #33251C)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #B3A194)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '0 0 16px 0',
              transition: 'color 0.15s ease',
            }}
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 106, 0, 0.12)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={28} color="var(--primary, #FF6A00)" />
          </div>

          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary, #F5EFEB)',
              letterSpacing: '-0.02em',
            }}
          >
            SIF-Guard
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--text-secondary, #B3A194)',
              lineHeight: 1.4,
            }}
          >
            Precursor Intelligence &amp; HSSE Safety Portal
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '2px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--primary, #FF6A00)',
              backgroundColor: 'rgba(255, 106, 0, 0.08)',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 106, 0, 0.2)',
            }}
          >
            Oil India Limited
          </div>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary, #120D09)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #33251C)',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: mode === 'login' ? 'var(--primary, #FF6A00)' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : 'var(--text-secondary, #B3A194)',
              transition: 'all 0.15s ease',
            }}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: mode === 'signup' ? 'var(--primary, #FF6A00)' : 'transparent',
              color: mode === 'signup' ? '#FFFFFF' : 'var(--text-secondary, #B3A194)',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={15} />
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(232, 93, 93, 0.12)',
              border: '1px solid rgba(232, 93, 93, 0.3)',
              color: '#FF8A8A',
              fontSize: '0.85rem',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(32, 217, 151, 0.12)',
              border: '1px solid rgba(32, 217, 151, 0.3)',
              color: '#34D399',
              fontSize: '0.85rem',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name field (Signup only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="fullName"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #B3A194)',
                  marginBottom: '6px',
                }}
              >
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #736154)',
                  }}
                />
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    fontSize: '0.9rem',
                    backgroundColor: 'var(--bg-secondary, #120D09)',
                    border: '1px solid var(--border-color, #33251C)',
                    borderRadius: '8px',
                    color: 'var(--text-primary, #F5EFEB)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #B3A194)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #736154)',
                }}
              />
              <input
                id="email"
                type="email"
                placeholder="name@oilindia.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--bg-secondary, #120D09)',
                  border: '1px solid var(--border-color, #33251C)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #F5EFEB)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #B3A194)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #736154)',
                }}
              />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--bg-secondary, #120D09)',
                  border: '1px solid var(--border-color, #33251C)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #F5EFEB)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
            </div>
            {mode === 'signup' && (
              <span style={{ display: 'block', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted, #736154)' }}>
                Must be at least 6 characters.
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '0.95rem',
              fontWeight: 600,
              backgroundColor: 'var(--primary, #FF6A00)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.75 : 1,
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted, #736154)' }}>
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #FF6A00)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Create one
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #FF6A00)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
