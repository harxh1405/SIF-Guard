-- ============================================================================
-- SIF-GUARD SUPABASE DATABASE SEED SCRIPT (OIL INDIA LIMITED)
-- Paste this script into your Supabase Dashboard -> SQL Editor to initialize
-- user_profiles table and RLS security policies.
-- ============================================================================

-- 1. Create Public User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('executive', 'inspector', 'supervisor', 'auditor', 'analyst')),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  facility_assignment TEXT,
  avatar_badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
DROP POLICY IF EXISTS "Public read profiles" ON public.user_profiles;
CREATE POLICY "Public read profiles" ON public.user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user update profile" ON public.user_profiles;
CREATE POLICY "Allow user update profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Seed Synthetic User Profile Records
INSERT INTO public.user_profiles (id, email, full_name, role, title, department, facility_assignment, avatar_badge)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'executive@oilindia.in', 'Rajesh K. Sharma', 'executive', 'Chief Safety Officer', 'Corporate HSSE HQ', 'Oil India HQ - Duliajan', '🛡️ CSO'),
  ('a0000000-0000-0000-0000-000000000002', 'inspector@oilindia.in', 'Ankit Borah', 'inspector', 'Senior HSE Inspector', 'Field Safety Division', 'Duliajan Production Zone', '🦺 INSPECTOR'),
  ('a0000000-0000-0000-0000-000000000003', 'supervisor@oilindia.in', 'Pranjal Gogoi', 'supervisor', 'Drilling Rig Supervisor', 'Upstream Operations', 'Rig No. 5 - Makum', '🏗️ SUPERVISOR'),
  ('a0000000-0000-0000-0000-000000000004', 'auditor@oilindia.in', 'Meenakshi Baruah', 'auditor', 'IOGP Compliance Lead', 'Standards & Audit', 'OCS-2 Jorajan', '📋 AUDITOR'),
  ('a0000000-0000-0000-0000-000000000005', 'analyst@oilindia.in', 'Devika Saikia', 'analyst', 'SIF Intelligence Analyst', 'AI & Telemetry Lab', 'Digital Innovation Hub', '📊 ANALYST')
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    title = EXCLUDED.title,
    department = EXCLUDED.department,
    facility_assignment = EXCLUDED.facility_assignment,
    avatar_badge = EXCLUDED.avatar_badge;
