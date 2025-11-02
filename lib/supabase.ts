import { createClient } from '@supabase/supabase-js';

// Prefer server-side envs, fallback to NEXT_PUBLIC for local/dev
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast to make misconfiguration obvious in API logs
  throw new Error('Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
