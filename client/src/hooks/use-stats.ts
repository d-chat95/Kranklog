import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useE1RMStats(movementFamily: string, variant?: string) {
  return useQuery({
    queryKey: [api.stats.e1rm.path, movementFamily, variant],
    queryFn: async () => {
      const url = new URL(api.stats.e1rm.path, window.location.origin);
      url.searchParams.append("movementFamily", movementFamily);
      if (variant) url.searchParams.append("variant", variant);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.e1rm.responses[200].parse(await res.json());
    },
    enabled: !!movementFamily,
  });
}

export function useSuggestions(movementFamily: string) {
  return useQuery({
    queryKey: [api.stats.suggestions.path, movementFamily],
    queryFn: async () => {
      const url = new URL(api.stats.suggestions.path, window.location.origin);
      url.searchParams.append("movementFamily", movementFamily);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return api.stats.suggestions.responses[200].parse(await res.json());
    },
    enabled: !!movementFamily,
  });
}
