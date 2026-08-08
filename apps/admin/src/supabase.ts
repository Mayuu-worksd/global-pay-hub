import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}
if (!supabaseServiceRoleKey) {
  console.error("[Supabase] Missing VITE_SUPABASE_SERVICE_ROLE_KEY — admin queries will be blocked by RLS!");
}

// Client for Auth Flow (persists session)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for Admin Data Operations — MUST use service role key to bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
