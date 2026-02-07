import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkout, type InsertWorkoutRow } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useWorkout(id: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id });
      const res = await apiRequest("GET", url);
      return api.workouts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkout) => {
      const res = await apiRequest("POST", api.workouts.create.path, data);
      return api.workouts.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.programs.get.path, variables.programId] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorkout> }) => {
      const url = buildUrl(api.workouts.update.path, { id });
      const res = await apiRequest("PATCH", url, data);
      return await res.json();
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.id] });
      if (variables.data.programId) {
        queryClient.invalidateQueries({ queryKey: [api.programs.get.path, variables.data.programId] });
      }
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const url = buildUrl(api.workouts.complete.path, { id });
      const res = await apiRequest("POST", url);
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, result.id] });
      if (result.programId) {
        queryClient.invalidateQueries({ queryKey: [api.programs.get.path, result.programId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/e1rm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/suggestions"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId }: { id: number; programId: number }) => {
      const url = buildUrl(api.workouts.delete.path, { id });
      const res = await apiRequest("DELETE", url);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.programs.get.path, variables.programId] });
      queryClient.invalidateQueries({ queryKey: [api.programs.list.path] });
    },
  });
}

export function useCreateWorkoutRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkoutRow) => {
      const res = await apiRequest("POST", api.workoutRows.create.path, data);
      return api.workoutRows.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}

export function useUpdateWorkoutRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorkoutRow> }) => {
      const url = buildUrl(api.workoutRows.update.path, { id });
      const res = await apiRequest("PATCH", url, data);
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, result.workoutId] });
    },
  });
}

export function useDeleteWorkoutRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.workoutRows.delete.path, { id });
      const res = await apiRequest("DELETE", url);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}
