import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'executive' | 'inspector' | 'supervisor' | 'auditor' | 'analyst';
  title: string;
  department: string;
  facility_assignment: string;
  avatar_badge: string;
}

export const SYNTHETIC_DEMO_USERS: Record<string, UserProfile & { passwordHint: string }> = {
  executive: {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'executive@oilindia.in',
    passwordHint: 'SifGuard#2026!',
    full_name: 'Rajesh K. Sharma',
    role: 'executive',
    title: 'Chief Safety Officer',
    department: 'Corporate HSSE HQ',
    facility_assignment: 'Oil India HQ - Duliajan',
    avatar_badge: '🛡️ CSO',
  },
  inspector: {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'inspector@oilindia.in',
    passwordHint: 'SafetyFirst#2026',
    full_name: 'Ankit Borah',
    role: 'inspector',
    title: 'Senior HSE Inspector',
    department: 'Field Safety Division',
    facility_assignment: 'Duliajan Production Zone',
    avatar_badge: '🦺 INSPECTOR',
  },
  supervisor: {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'supervisor@oilindia.in',
    passwordHint: 'RigSuper#2026',
    full_name: 'Pranjal Gogoi',
    role: 'supervisor',
    title: 'Drilling Rig Supervisor',
    department: 'Upstream Operations',
    facility_assignment: 'Rig No. 5 - Makum',
    avatar_badge: '🏗️ SUPERVISOR',
  },
  auditor: {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'auditor@oilindia.in',
    passwordHint: 'AuditPass#2026',
    full_name: 'Meenakshi Baruah',
    role: 'auditor',
    title: 'IOGP Compliance Lead',
    department: 'Standards & Audit',
    facility_assignment: 'OCS-2 Jorajan',
    avatar_badge: '📋 AUDITOR',
  },
  analyst: {
    id: 'a0000000-0000-0000-0000-000000000005',
    email: 'analyst@oilindia.in',
    passwordHint: 'DataAnalyst#2026',
    full_name: 'Devika Saikia',
    role: 'analyst',
    title: 'SIF Intelligence Analyst',
    department: 'AI & Telemetry Lab',
    facility_assignment: 'Digital Innovation Hub',
    avatar_badge: '📊 ANALYST',
  },
};

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoRole: (roleKey: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('sif_guard_active_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchSupabaseProfile(session.user.email, session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchSupabaseProfile(session.user.email, session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchSupabaseProfile = async (email: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (data && !error) {
        setProfile(data);
        localStorage.setItem('sif_guard_active_user', JSON.stringify(data));
      } else {
        // Find matching synthetic persona
        const match = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) {
          setProfile(match);
          localStorage.setItem('sif_guard_active_user', JSON.stringify(match));
        } else {
          const fallbackProfile: UserProfile = {
            id: userId,
            email,
            full_name: email.split('@')[0].toUpperCase(),
            role: 'analyst',
            title: 'HSE Safety Officer',
            department: 'Oil India Operations',
            facility_assignment: 'Duliajan Headquarter',
            avatar_badge: '🛡️ HSE',
          };
          setProfile(fallbackProfile);
          localStorage.setItem('sif_guard_active_user', JSON.stringify(fallbackProfile));
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    // 1. Try Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      setUser(data.user);
      await fetchSupabaseProfile(data.user.email || email, data.user.id);
      return;
    }

    // 2. Synthetic Fallback Authentication
    const match = Object.values(SYNTHETIC_DEMO_USERS).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (match) {
      setUser({ id: match.id, email: match.email });
      setProfile(match);
      localStorage.setItem('sif_guard_active_user', JSON.stringify(match));
      setLoading(false);
      return;
    }

    setLoading(false);
    throw new Error(error?.message || 'Invalid user credentials. Please check your email and password.');
  };

  const loginAsDemoRole = (roleKey: string) => {
    const match = SYNTHETIC_DEMO_USERS[roleKey] || SYNTHETIC_DEMO_USERS.executive;
    setUser({ id: match.id, email: match.email });
    setProfile(match);
    localStorage.setItem('sif_guard_active_user', JSON.stringify(match));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('sif_guard_active_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: Boolean(profile),
        loading,
        login,
        loginAsDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
