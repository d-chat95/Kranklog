import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User } from "@shared/models/auth";
import type { Session } from "@supabase/supabase-js";
import { apiRequest } from "@/lib/queryClient";

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
        // Invalidate user profile query when auth state changes
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Fetch user profile from our API (local users table)
  const { data: user, isLoading: profileLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/user");
      return res.json();
    },
    enabled: !!session,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = sessionLoading || (!!session && profileLoading);

  async function logout() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return {
    user: session ? user : null,
    session,
    isLoading,
    isAuthenticated: !!session,
    logout,
  };
}
