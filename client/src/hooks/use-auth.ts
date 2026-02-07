import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

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
  // Uses the token directly from the session state (not the module-level cache)
  // to avoid race conditions when the session just changed
  const {
    data: user,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user", session?.access_token],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("No token");

      const res = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        await supabase.auth.signOut();
        throw new Error("Session expired");
      }
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!session?.access_token,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = sessionLoading || (!!session && profileLoading && !profileError);

  async function logout() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return {
    user: user ?? null,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    logout,
  };
}
