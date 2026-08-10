import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gcztbdlbvcjtnwicdiqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjenRiZGxidmNqdG53aWNkaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjk1ODAsImV4cCI6MjEwMTYwNTU4MH0.q_boLusUP2DGeWuO6eIjOZN4DN7Ko2eh7bji9lW2XtU";

// Client for Auth Flow (persists session)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Secure alias: supabaseAdmin now routes through standard client-side client
// so RLS rules are respected, and SUPABASE_SERVICE_ROLE_KEY never reaches the bundle
export const supabaseAdmin = supabase;
