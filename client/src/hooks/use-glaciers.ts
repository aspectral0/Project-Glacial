import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertScore } from "@shared/schema";

export function useGlaciers() {
  return useQuery({
    queryKey: [api.glaciers.list.path],
    queryFn: async () => {
      const res = await fetch(api.glaciers.list.path);
      if (!res.ok) throw new Error("Failed to fetch glaciers");
      return api.glaciers.list.responses[200].parse(await res.json());
    },
  });
}

export function useGlacier(id: number) {
  return useQuery({
    queryKey: [api.glaciers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.glaciers.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch glacier");
      return api.glaciers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useScores() {
  return useQuery({
    queryKey: [api.scores.list.path],
    queryFn: async () => {
      const res = await fetch(api.scores.list.path);
      if (!res.ok) throw new Error("Failed to fetch scores");
      return api.scores.list.responses[200].parse(await res.json());
    },
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertScore) => {
      const res = await fetch(api.scores.create.path, {
        method: api.scores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit score");
      return api.scores.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.scores.list.path] });
    },
  });
}
