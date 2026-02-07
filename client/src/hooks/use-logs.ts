import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type CreateLogInput = InsertLog & { date?: string };

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLogInput) => {
      const res = await apiRequest("POST", api.logs.create.path, data);
      return api.logs.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      const params = { workoutRowId: variables.workoutRowId.toString() };
      queryClient.invalidateQueries({
        queryKey: [api.logs.list.path, JSON.stringify(params)]
      });
      queryClient.invalidateQueries({ queryKey: [api.stats.e1rm.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.suggestions.path] });
    },
  });
}

export function useLogs(params?: { workoutRowId?: string; movementFamily?: string; isAnchor?: string }) {
  const queryKey = [api.logs.list.path, JSON.stringify(params)];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.logs.list.path, window.location.origin);
      if (params) {
        if (params.workoutRowId) url.searchParams.append("workoutRowId", params.workoutRowId);
        if (params.movementFamily) url.searchParams.append("movementFamily", params.movementFamily);
        if (params.isAnchor) url.searchParams.append("isAnchor", params.isAnchor);
      }
      const res = await apiRequest("GET", url.toString());
      return api.logs.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { weight?: string; reps?: number; rpe?: string | null; notes?: string | null; date?: string } }) => {
      const url = buildUrl(api.logs.update.path, { id });
      const res = await apiRequest("PATCH", url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === api.logs.list.path });
      queryClient.invalidateQueries({ queryKey: [api.stats.e1rm.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.suggestions.path] });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.logs.delete.path, { id });
      const res = await apiRequest("DELETE", url);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === api.logs.list.path });
      queryClient.invalidateQueries({ queryKey: [api.stats.e1rm.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.suggestions.path] });
    },
  });
}
