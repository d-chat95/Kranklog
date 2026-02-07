import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setSessionLoading(false);
      // Refetch user profile when session changes (login, logout, token refresh)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Fetch user profile from our backend.
  // Stable query key (no token) so token refreshes don't cause re-loading states.
  // The token is read from session at fetch time.
  const {
    data: user,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("No token");

      const res = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Backend rejected the token — clear stale session
        await supabase.auth.signOut();
        throw new Error("Session expired");
      }
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    enabled: !!session?.access_token,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading =
    sessionLoading || (!!session && profileLoading && !profileError);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  return {
    user: user ?? null,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    logout,
  };
}
