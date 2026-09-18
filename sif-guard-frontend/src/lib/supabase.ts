import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('your-project-id')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[SIF-Guard Supabase Warning]: Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Running in local/demo mode.'
  );
}

// Ensure valid URL structure is passed so SupabaseClient constructor does not throw
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://sif-guard-demo.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sifguard';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

