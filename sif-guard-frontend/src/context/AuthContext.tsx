import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile({ id: userId, full_name: 'Lead Safety Auditor (Oil India)' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile({ id: userId, full_name: null });
      }
    } catch (err) {
      console.error('[SIF-Guard Auth] Failed to fetch profile:', err);
      setProfile({ id: userId, full_name: null });
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      // Offline / Local Mode: check localStorage for cached demo session
      const cached = localStorage.getItem('sifguard_demo_session');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed.user);
          setSession(parsed.session);
          setProfile(parsed.profile);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('[SIF-Guard Auth] Error fetching initial session:', err);
      if (mounted) setLoading(false);
    });

    // 2. Subscribe to auth state updates (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = () => {
    const demoUser: User = {
      id: 'oil-india-demo-auditor',
      app_metadata: {},
      user_metadata: { full_name: 'Lead Safety Auditor (Oil India)' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'auditor@oilindia.in',
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    const demoSession: Session = {
      access_token: 'demo-access-token-oil-india',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh-token',
      user: demoUser,
    };
    const demoProfile: UserProfile = {
      id: demoUser.id,
      full_name: 'Lead Safety Auditor (Oil India)',
    };
    setUser(demoUser);
    setSession(demoSession);
    setProfile(demoProfile);
    localStorage.setItem('sifguard_demo_session', JSON.stringify({
      user: demoUser,
      session: demoSession,
      profile: demoProfile,
    }));
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const trimmed = email.trim();
    if (!isSupabaseConfigured || trimmed.toLowerCase().includes('demo') || trimmed === 'auditor@oilindia.in') {
      loginAsDemo();
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'A network error occurred during login') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null; user: User | null }> => {
    const trimmed = email.trim();
    if (!isSupabaseConfigured) {
      loginAsDemo();
      return { error: null, user: null };
    }

    try {
      const trimmedName = fullName.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (signUpError) {
        return { error: new Error(signUpError.message), user: null };
      }

      const createdUser = data.user;

      // Create matching profiles record
      if (createdUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: createdUser.id,
            full_name: trimmedName,
          });

        if (profileError) {
          console.warn('[SIF-Guard Auth] Notice: Profile table insertion returned:', profileError.message);
        } else {
          setProfile({ id: createdUser.id, full_name: trimmedName });
        }
      }

      return { error: null, user: createdUser };
    } catch (err: any) {
      return { error: new Error(err?.message || 'A network error occurred during signup'), user: null };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem('sifguard_demo_session');
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[SIF-Guard Auth] SignOut error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
