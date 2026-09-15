import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlmoozouthyusfsmmbcu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbW9vem91dGh5dXNmc21tYmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDA1NzksImV4cCI6MjEwNDM3NjU3OX0.qsSrqTXBRb-StfB5b8E_2EPyD8Rh9rBBEq6wdW9uw1I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
