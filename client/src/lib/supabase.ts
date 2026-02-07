import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

// Module-level session cache - kept in sync by auth state listener.
// This avoids async race conditions when multiple API calls fire simultaneously.
let currentSession: Session | null = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  currentSession = session;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
});

/** Get the current access token synchronously (no async race conditions) */
export function getAccessToken(): string | null {
  return currentSession?.access_token ?? null;
}
