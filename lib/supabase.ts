import { createClient } from '@supabase/supabase-js';

// Prefer server-side envs, fallback to NEXT_PUBLIC for local/dev
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast to make misconfiguration obvious in API logs
  throw new Error('Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

// Regular client with anon key (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role (bypasses RLS) - use only in server-side API routes
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback to anon key if service role not available
