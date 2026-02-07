import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useE1RMStats(movementFamily: string, isAnchor?: boolean) {
  return useQuery({
    queryKey: [api.stats.e1rm.path, movementFamily, isAnchor],
    queryFn: async () => {
      const url = new URL(api.stats.e1rm.path, window.location.origin);
      url.searchParams.append("movementFamily", movementFamily);
      if (isAnchor !== undefined) url.searchParams.append("isAnchor", String(isAnchor));

      const res = await apiRequest("GET", url.toString());
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

      const res = await apiRequest("GET", url.toString());
      return api.stats.suggestions.responses[200].parse(await res.json());
    },
    enabled: !!movementFamily,
  });
}

export function useLoadRecommendation(movementFamily: string, targetReps: string, targetRpe: string) {
  const repsNum = parseInt(targetReps);
  const rpeNum = parseFloat(targetRpe);
  const enabled = !!movementFamily && !isNaN(repsNum) && repsNum > 0 && !isNaN(rpeNum) && rpeNum > 0;

  return useQuery({
    queryKey: [api.stats.suggestions.path, movementFamily, targetReps, targetRpe],
    queryFn: async () => {
      const url = new URL(api.stats.suggestions.path, window.location.origin);
      url.searchParams.append("movementFamily", movementFamily);
      url.searchParams.append("targetReps", targetReps);
      url.searchParams.append("targetRpe", targetRpe);

      const res = await apiRequest("GET", url.toString());
      return api.stats.suggestions.responses[200].parse(await res.json());
    },
    enabled,
  });
}
