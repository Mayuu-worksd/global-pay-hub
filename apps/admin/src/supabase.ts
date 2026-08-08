import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gcztbdlbvcjtnwicdiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjenRiZGxidmNqdG53aWNkaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjk1ODAsImV4cCI6MjEwMTYwNTU4MH0.q_boLusUP2DGeWuO6eIjOZN4DN7Ko2eh7bji9lW2XtU";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjenRiZGxidmNqdG53aWNkaXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyOTU4MCwiZXhwIjoyMTAxNjA1NTgwfQ.SrgAkOHsOMiJzbwAHUpnhQWzfPCcUgpr8y7WwNQat0E";

// Client for Auth Flow (persists session)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client for Admin Data Operations — uses service role key to bypass RLS
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
