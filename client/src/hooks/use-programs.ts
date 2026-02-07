import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProgram } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function usePrograms() {
  return useQuery({
    queryKey: [api.programs.list.path],
    queryFn: async () => {
      const res = await apiRequest("GET", api.programs.list.path);
      return api.programs.list.responses[200].parse(await res.json());
    },
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: [api.programs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.programs.get.path, { id });
      const res = await apiRequest("GET", url);
      return api.programs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProgram) => {
      const res = await apiRequest("POST", api.programs.create.path, data);
      return api.programs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProgram> }) => {
      const url = buildUrl(api.programs.update.path, { id });
      const res = await apiRequest("PATCH", url, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.programs.get.path, variables.id] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.programs.delete.path, { id });
      const res = await apiRequest("DELETE", url);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
    },
  });
}
