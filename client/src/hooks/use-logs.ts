import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertLog } from "@shared/schema";

type CreateLogInput = InsertLog & { date?: string };

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLogInput) => {
      const res = await fetch(api.logs.create.path, {
        method: api.logs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log set");
      return api.logs.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      // Invalidate specifically the list with these params to ensure immediate update
      const params = { workoutRowId: variables.workoutRowId.toString() };
      queryClient.invalidateQueries({ 
        queryKey: [api.logs.list.path, JSON.stringify(params)]
      });
      // Also invalidate stats to update e1RM charts and suggestions
      queryClient.invalidateQueries({ queryKey: [api.stats.e1rm.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.suggestions.path] });
    },
  });
}

export function useLogs(params?: { workoutRowId?: string; movementFamily?: string; isAnchor?: string }) {
  // Create a unique key based on params
  const queryKey = [api.logs.list.path, JSON.stringify(params)];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually since we don't have a helper for it yet in shared routes
      const url = new URL(api.logs.list.path, window.location.origin);
      if (params) {
        if (params.workoutRowId) url.searchParams.append("workoutRowId", params.workoutRowId);
        if (params.movementFamily) url.searchParams.append("movementFamily", params.movementFamily);
        if (params.isAnchor) url.searchParams.append("isAnchor", params.isAnchor);
      }
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.list.responses[200].parse(await res.json());
    },
  });
}
