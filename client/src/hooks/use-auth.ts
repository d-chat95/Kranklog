import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "@/lib/supabase";

export function useAuth() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSessionLoading(false);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Fetch user profile from our API (local users table)
  // Uses fetch directly (not apiRequest) so we can inspect status codes
  const {
    data: user,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("No token");

      const res = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token rejected by backend - clear stale session
        await supabase.auth.signOut();
        throw new Error("Session expired");
      }
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!session,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // If profile fetch fails, don't stay stuck in loading forever
  const isLoading = sessionLoading || (!!session && profileLoading && !profileError);

  async function logout() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return {
    user: user ?? null,
    session,
    isLoading,
    // Only authenticated when backend confirms the user exists
    isAuthenticated: !!session && !!user,
    logout,
  };
}
