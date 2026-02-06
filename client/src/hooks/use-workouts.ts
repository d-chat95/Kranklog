import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkout, type InsertWorkoutRow } from "@shared/schema";

export function useWorkout(id: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch workout");
      return api.workouts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkout) => {
      const res = await fetch(api.workouts.create.path, {
        method: api.workouts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return api.workouts.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific program this workout belongs to
      const programUrl = buildUrl(api.programs.get.path, { id: variables.programId });
      queryClient.invalidateQueries({ queryKey: [programUrl] });
    },
  });
}

export function useCreateWorkoutRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkoutRow) => {
      const res = await fetch(api.workoutRows.create.path, {
        method: api.workoutRows.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add exercise");
      return api.workoutRows.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      const workoutUrl = buildUrl(api.workouts.get.path, { id: variables.workoutId });
      queryClient.invalidateQueries({ queryKey: [workoutUrl] });
    },
  });
}
